/* eslint-env node

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

var express = require('express');
var envRouter = express.Router();
var PMClient = require('../pm_client');

/*
 * GET all available models in PA service
 */

envRouter.get('/models', function (req, res) {
  var pmEnv = req.app.get('pm service env');
  var pmClient = new PMClient(pmEnv);
  pmClient.getModels(function (err, models) {
    if (err) {
      res.status(500).json({error: err.message});
    }
    res.json(models);
  });
});

/*
 * Get Score
 */

envRouter.post('/score/:contextId', function (req, res) {
  var contextId = req.params.contextId;
  var scoringData = req.body.scoringData;
  var tableName = req.body.tableName;

  scoringData = scoringData.split('\n');
  scoringData = scoringData.map(function (row) {
    return row.split(',').map(function (v) {
      return v.trim();
    });
  });

  var pmEnv = req.app.get('pm service env');
  var pmClient = new PMClient(pmEnv);
  pmClient.getModel(contextId, function (err, model) {
    if (err) {
      throw err;
    }

    var scoreParam = {
      'tablename': tableName,
      'header': Object.keys(model.tableData[tableName]),
      'data': scoringData
    };

    pmClient.getScore(contextId, scoreParam, function (err, score) {
      if (err) {
        res.status(500);
        res.json({error: err});
      }
      res.json(score);
    });
  });
});

exports.env = envRouter;
