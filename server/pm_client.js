/* eslint-env node es6

   Copyright 2016 IBM Corp.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

'use strict';

var request = require('request');
var parseString = require('xml2js').parseString;
var log4js = require('../app/utils/log4js-logger-util');
var logger = log4js.getLogger('server/pm_client');

var PMClient = module.exports = function (pmService) {
  this.pmService = pmService;
  if (pmService) {
    this.credentials = pmService.credentials;
  }
};

var FAKE_MODELS = [
  {
    id: '123',
    stream: 'test.sev',
    tableData: {
      dataTable1: {
        'ID': 'INTEGER',
        'Age': 'INTEGER',
        'Sex': 'STRING'
      },
      dataTable2: {
        'ID': 'INTEGER',
        'Age': 'INTEGER',
        'Sex': 'STRING',
        'res': 'INTEGER'
      }
    }
  },
  {
    id: '212',
    stream: 'test2.sev',
    tableData: {
      dataTable2: {
        'ID': 'INTEGER',
        'Value': 'INTEGER'
      }
    }
  },
  {
    id: 'drug1N',
    stream: 'drug1N.mocked.str',
    tableData: {
      trainingData: {
        'Age': 'INTEGER',
        'Sex': 'STRING',
        'BP': 'STRING',
        'Cholesterol': 'STRING',
        'Na': 'FLOAT',
        'K': 'FLOAT',
        'res': 'FLOAT'
      },
      scoreInput: {
        'Age': 'INTEGER',
        'Sex': 'STRING',
        'BP': 'STRING',
        'Cholesterol': 'STRING',
        'Na': 'FLOAT',
        'K': 'FLOAT'
      }
    }
  }
];

PMClient.prototype = {

  getModel: function (contextId, callback) {
    logger.enter('getModel()', contextId);
    var modelUri = this.credentials.url + '/metadata/' + contextId +
      '?accesskey="' + this.credentials.access_key + '"';
    request.get(modelUri, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        var metadata = JSON.parse(body);
        var flag = metadata.flag;
        var message = metadata.message;
        if (flag) {
          parseModelMetadata(message, function (error, model) {
            if (error) {
              return callback(error);
            } else {
              model.id = contextId;
              logger.return('getModel()', 'model description for contextId=' +
                    contextId + ' with info about following tables: ' +
                    Object.keys(model.tableData));
              return callback(null, model);
            }
          });
        } else {
          error = new Error('PA service error: ' + message);
          logger.error('getModel()', 'stream with id=' + contextId, message);
          return callback(error);
        }
      } else if (error) {
        logger.error('getModel()', 'stream with id=' + contextId, error);
        return callback(error);
      } else {
        error = new Error('Service error code: ' + response.statusCode);
        logger.error('getModel()', 'stream with id=' + contextId,
          'statusCode: ' + response.statusCode);
        return callback(error);
      }
    });
  },

  getScore: function (contextId, scoreParam, callback) {
    logger.enter('getScore()',
          'contextId: ' + contextId + ', scoreParam: ' + scoreParam);
    var scoreUri = this.credentials.url + '/score/' + contextId +
      '?accesskey="' + this.credentials.access_key + '"';
    var body = JSON.stringify(scoreParam);
    logger.debug('getScore()', 'contextId=' + contextId +
      ', url: ' + this.credentials.url + '/score/' + contextId + '?accesskey=xxx');
    logger.debug('getScore()',
          'contextId=' + contextId + ', body: ' + body);
    request.post({
      headers: {'content-type': 'application/json'},
      url: scoreUri,
      body: body
    }, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        var scoreResponse = JSON.parse(body);
        if (scoreResponse.flag === false) {
          logger.error('getScore()', 'error during scoring stream \
with contextId=' + contextId + ', msg: ' +
scoreResponse.message.substring(0, scoreResponse.message.indexOf('\n')));
          return callback(new Error('PA service error: ' + scoreResponse.message));
        } else {
          logger.info('getScore()', 'successfully finished scoring for \
stream with contextId=' + contextId);
          logger.return('getScore()',
                scoreResponse.length + ' row(s) of result');
          return callback(null, scoreResponse);
        }
      } else if (error) {
        logger.error(error);
        return callback(error);
      } else {
        error = new Error('Service error code: ' + response.statusCode);
        logger.error('getScore()', 'error during scoring stream \
with contextId=' + contextId + ', msg: ' + error);
        return callback(error);
      }
    });
  },

  getModels: function (callback) {
    logger.enter('getModels()');
    var client = this;
    if (!this.credentials) {
      logger.info('getModels()', 'Using FAKE_MODELS');
      return callback(null, FAKE_MODELS);
    } else {
      var modelsUri = this.credentials.url + '/model/' + '?accesskey="' +
        this.credentials.access_key + '"';
      request.get(modelsUri, function (error, response, body) {
        if (!error && response.statusCode === 200) {
          let models = JSON.parse(body);
          logger.debug(`There are ${models.length} models uploaded`);
          let modelsData = models.map((model) => {
            return new Promise((resolve, reject) => {
              client.getModel(model.id, function (error, modelMetadata) {
                if (error) {
                  reject(error);
                } else {
                  model.tableData = modelMetadata.tableData;
                  resolve();
                }
              });
            });
          });
          Promise.all(modelsData)
          .then(() => {
            logger.return('getModels()');
            return callback(null, models);
          }
          )
          .catch((err) => {
            logger.error('geModels()', err);
            return callback(error);
          });
        } else if (error) {
          logger.error('getModels()', error);
          return callback(error);
        } else {
          error = new Error('Service error code: ' + response.statusCode);
          logger.error('getModels()', error);
          return callback(error);
        }
      });
    }
  }
};

function parseModelMetadata(metadata, callback) {
  parseString(metadata, {
    trim: true
  }, function (error, result) {
    if (!error) {
      var scoringInput = {
        'tableData': {}
      };

      result['metadata']['table'].forEach(function (tableEntry) {
        var fields = tableEntry['field'];
        var fieldsNames = {};
        for (var item in fields) {
          fieldsNames[fields[item]['$']['name']] =
              fields[item]['$']['storageType'];
        }
        scoringInput.tableData[tableEntry['$']['name']] = fieldsNames;
      });
      return callback(null, scoringInput);
    } else {
      logger.error('parseModelMetadata()', error);
      return callback(error);
    }
  });
}
