[ml]: https://console.ng.bluemix.net/catalog/services/ibm-watson-machine-learning/  "ML"
[bm]: https://console.ng.bluemix.net/
[general]: https://github.com/pmservice/drug-selection/blob/master/documentation/IBM%20Watson%20Machine%20Learning%20for%20Bluemix%20-%20General.pdf
[pa-api]: https://console.ng.bluemix.net/docs/services/PredictiveModeling/index-gentopic1.html#pm_service_api

# About
This sample application demonstrates the [IBM Watson Machine Learning][ml] [Bluemix][bm] offering. It's an extension of the Big Data University [Predicting Customer Satisfaction course](https://courses.bigdatauniversity.com/courses/course-v1%3ABigDataUniversity%2BPA0103EN%2B2016/). While participation in the course is recommended, it is not required.

This application is based on Node.js and Express framework. It uses the [Watson Machine Learning service API](https://console.ng.bluemix.net/docs/services/PredictiveModeling/index-gentopic1.html#pm_service_api) to integrate with IBM SPSS Modeler analytics.

With this sample scoring application, you can:
* Select one of the IBM SPSS Modeler streams uploaded to the *Watson Machine Learning* service on Bluemix
* Specify which source node should be used as the scoring input
* Verify the required input data schema (field name and type)
* Drag-and-drop a *csv* file that contains input data for scoring (or double-click an input data field to open the file browser)
* Click the „Perform Calculations” button to call the *Watson Machine Learning* service scoring API
* Display the scoring results table

![Application screenshot](/doc/app-scr.png)


# Requirements
* [IBM ID](https://www.ibm.com/account/profile/us?page=reg) to log in to [Bluemix][bm]. See [free trial](http://www.ibm.com/developerworks/cloud/library/cl-bluemix-fundamentals-start-your-free-trial/index.html) if you don't yet have an ID.
* [Cloud Foundry command line interface](https://github.com/cloudfoundry/cli/releases) (only if you want to manually deploy to Bluemix)
* [IBM SPSS Modeler](http://ibm.com/tryspss) (only if you want to modify streams or create new ones; see [SPSS Modeler stream preparation](#spss-modeler-stream-preparation) for details)
* [Node.js](https://nodejs.org) runtime (only if you want to modify the source code)

### Preparing the Bluemix ecosystem
The general, high-level steps are described below. Refer to [IBM Watson Machine Learning Service for Bluemix - General][general] for complete details.

1. From the Bluemix catalog, choose the [Watson Machine Learning][ml] service. This service will later bind with a Node.js application created from this sample. From this point, note that the service itself offers a set of samples (this particular one among them) that can be automatically deployed and bound, which is the simplest way to see the sample in action.
2. Upload a SPSS Modeler stream file to your instance of the *Watson Machine Learning* service (the classic service with SPSS streams). This sample comes with an SPSS Modeler stream (stream/customer-satisfaction-prediction.str) that can be used for this purpose.


# Deploying the prebuilt app
For a fast start, you can deploy the prebuilt app to Bluemix by clicking the following button:

[![Deploy to Bluemix](https://bluemix.net/deploy/button.png)](https://bluemix.net/deploy?repository=https://github.com/pmservice/customer-satisfaction-prediction)

Note that the application is fully functional only if bound with an instance of the *Watson Machine Learning* service, which must be done manually. See [instructions](#binding-services-in-bluemix).

### Manually deploying to Bluemix
As an alternative to the button, you can manually deploy the application to Bluemix by pushing it with Cloud Foundry commands, as described in next [section](#push-to-bluemix). Manual deployment is required when you want to deploy [modified source code](#source-code-changes). Manual deployment consists of [pushing](#push-to-bluemix) the application to Bluemix followed with [binding](#binding-services-in-bluemix) the *Watson Machine Learning* service to the deployed application.

##### Pushing to Bluemix
To push an application to Bluemix, open a shell, change to the directory of your application, and execute the following:
  * `cf api <region>` where <*region*> part may be https://api.ng.bluemix.net or https://api.eu-gb.bluemix.net depending on the Bluemix region you want to work with (US or Europe, respectively)
  * `cf login` which is interactive; provide all required data
  * `cf push <app-name>` where <*app-name*> is the application name of your choice

`cf push` can also read the manifest file (see [Cloud Foundry Documentation](http://docs.cloudfoundry.org/devguide/deploy-apps/manifest.html)). If you decide to use the manifest, you can hardcode the name of your instance of the Watson Machine Learning service instead of binding it manually. See the *services* section [manifest.yml.template](manifest.yml.template) file.

If this is your first Bluemix Node.js application, see the [node-helloworld project documentation](https://github.com/IBM-Bluemix/node-helloworld) to gain general experience.

##### Binding the Watson Machine Learning service
See the [instructions](#binding-services-in-bluemix).

### Deploying locally
Running the application locally is useful when you want to test your changes before deploying them to Bluemix. For information about working with source code, see [Source code changes](#source-code-changes).

When the changes are ready, open a shell, change the directory to your cloned repository, and run `npm start` to start the application. The running application is available in a browser at http://localhost:6001.

Applications that run locally can also use the Watson Machine Learning service. See the [instructions](#link-local-application-with-the-bluemix-environment).

## Rebuilding the app after modifying source code
The repository comes with a prebuilt application. If you want to rebuild app after modifying the sources:
  * Follow the steps listed in the [Requirements](#requirements) section
  * Change to the directory containing the downloaded source code or the cloned git repo
  * Run `npm install`
  * Run `./node_modules/.bin/webpack`


# Watson Machine Learning service (classic service with SPSS streams)
To empower any application with IBM SPSS Modeler analytics, use the [Watson Machine Learning service API][pa-api].

The source code placed in the [pm_client.js](server/pm_client.js) file provides an example of how to call this [service API][pa-api] through JavaScript code. It demonstrates the following aspects:
  * Retrieval of all currently deployed models
  * Metadata retrieval for a chosen predictive model
  * Scoring with a chosen predictive model


## Binding services in Bluemix
As stated in the [Requirements](#requirements) section, from the Bluemix catalog you must order an instance of the *Watson Machine Learning* service if you don't yet have one. The next step is to connect your deployed application to the service, which is called *binding*. There are a few ways to achieve this in the Bluemix environment. [This documentation](https://console.ng.bluemix.net/docs/cfapps/ee.html) describes binding either via the Bluemix user interface or by using cf cli.

## Linking a local application with the Bluemix environment
1. Deploy the application to Bluemix and bind it to the [Watson Machine Learning][ml].
2. Go to the application overview pane, choose the bound Watson Machine Learning service, and click 'Show Credentials.' Copy the pm-20 *credentials* json portion (url, access_key).
3. Create a *./config/local.json* file by copying the *./config/local.json.template* file. Edit the *local.json* file and paste the pm-20 credentials you obtained in the previous step.
4. Start your local application. You should now be able to interact with the Watson Machine Learning service (for example, by listing the uploaded models).


# Preparing the SPSS Modeler stream
The IBM SPSS Modeler stream file [customer-satisfaction-prediction.str](stream/customer-satisfaction-prediction.str) is included with this sample application. The file is located in the stream subdirectory.
The scoring branch (highlighted in green) is the trained predictive model (Support Vector Machine with RBF kernel).

![Stream screenshot](/doc/stream-scr.png)

The stream requires input data on the source node when making a scoring request, as shown below. The sample input data file [scoreInput.csv](data/scoreInput.csv) is in the data subdirectory.

![Stream screenshot](/doc/input-scr.png)

The scoring request result is represented by the 'Output data' Table node. The predicted churn and probability of churn are represented by the 'Predicted Churn' and "Probability of Churn" fields defined in the Table node.

![Stream screenshot](/doc/output-scr.png)


# License
The code is available under the Apache License, Version 2.0.
