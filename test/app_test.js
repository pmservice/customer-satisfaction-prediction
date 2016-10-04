'use strict';

require('./helpers');
var chai = require('chai');
var expect = chai.expect;
var request = require('supertest');

var app = require('../server').app;

describe('Application', function () {
  it('should set app CF env', function () {
    var appEnv = app.get('app env');
    expect(appEnv.isLocal).to.be.ok;
  });

});
