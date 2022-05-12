# 493-assignment7-openid-jwt
Implementing the OpenID protocol on top of OAuth 2.0, using JSON Web Tokens to verify the user's identity.

Uses Node.js v14x
 - nvm use 14

This code implements the OpenID protocol on top of OAuth
 - With google, the request


To deploy to GCloud from local WSL env
 - gcloud init
 - gcloud app deploy

To run this codebase on your localhost, ensure to set DB permissions locally. Must be done for each terminal session. This allows you to run locally, and talk to the gcloud database
 - export GOOGLE_APPLICATION_CREDENTIALS="KEY_PATH"

 keypath is the path & filename of the JSON file from GCloud that authenticates the service account
 see: https://cloud.google.com/docs/authentication/getting-started
 our key_path file: "assignment-7-open-id-db_key_maybe.json"

command: export GOOGLE_APPLICATION_CREDENTIALS="assignment-7-open-id-db_key_maybe.json"
