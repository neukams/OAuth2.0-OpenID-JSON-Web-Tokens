/**
 * This file handles the requests and responses on behalf of server.js, for each route
 */

const axios = require('axios');
const {OAuth2Client} = require('google-auth-library');
const client_creds = require('./client_secret_hw7_oauth_openid_connec_params.json');
const db = require('./db');
const utils = require('./utils');

/**
 * Returns Google's public RSA key, used to validate JWT Tokens returned from Google's OAuth 2.0 service
 */
async function get_google_public_rsa_key() {
    console.log('\nget_google_public_rsa_keys()');

    var res = await axios.get('https://www.googleapis.com/oauth2/v3/certs');
    var keys = res.data.keys;

    for (var index in keys) {
            if (keys[index].alg == 'RS256') {
                return keys[index].n;
            }
    }

    throw 'Error: Did not find RS256 public key in Google response.';
}

/**
 * 
 * @param {*} req The request object contains the JWT as a Bearer token in the Authorization header: {Authorization: 'Bearer some-jwt-token'}
 * @returns 
 */
function get_jwt(req) {
    console.log('get_jwt()');

    try {
        if (req.headers.authorization.length <= String('Bearer ').length) {
            console.log('no jwt found in auth req header');
            return '';
        }
    } catch {
        return '';
    }

    return req.headers.authorization.slice(req.headers.authorization.search(' ')+1);
}

/**
 * 
 * Source: https://thewebdev.info/2022/01/22/how-to-find-the-nth-occurrence-of-a-character-in-a-string-in-javascript/#:~:text=string%20in%20JavaScript%3F-,To%20find%20the%20nth%20occurrence%20of%20a%20character%20in%20a,with%20the%20from%20index%20argument.&text=We%20define%20the%20indexOfNth%20function,to%20start%20searching%20from%20fromIndex%20.
 * ^ This is not my function
 * 
 * @param {*} string String to search
 * @param {*} char Character to look for
 * @param {*} nth Nth occurence
 * @param {*} fromIndex Starting index
 * @returns 
 */
const indexOfNth = (string, char, nth, fromIndex = 0) => {
    const indexChar = string.indexOf(char, fromIndex);
    if (indexChar === -1) {
      return -1;
    } else if (nth === 1) {
      return indexChar;
    } else {
      return indexOfNth(string, char, nth - 1, indexChar + 1);
    }
}

/**
 * 
 * @param {*} jwt JSON Web Token (base64 encoded)
 */
function get_jwt_section(section, jwt) {
    console.log('\nget_jwt_section()');
    console.log('\nsection=' + section);

    if (section === 'header') {
        return jwt.slice(0, jwt.search('.'));
    } else if (section === 'payload') {
        return jwt.slice(indexOfNth(jwt, '.', 1) + 1, indexOfNth(jwt, '.', 2));
    } else if (section === 'signature') {
        return jwt.slice(indexOfNth(jwt, '.', 2) + 1);
    }
    
    throw 'error: invalid section. must be [header, payload, signature]';
}

async function validateJWT(token) {
    console.log('validateJWT()');
    try {
        const gauth = new OAuth2Client(client_creds.web.client_id);
        const ticket = await gauth.verifyIdToken({
            idToken: token,
            audience: client_creds.web.client_id
        });
        const payload = ticket.getPayload();
        const userid = payload['sub'];
        return userid;
    } catch (err) {
        console.log('Error occured in validateJWT()');
        console.log(err);
    }
    return '';
}

/**
 * 
 * Handler for POST /boats
 * 
 * @param {*} req Request object
 * @param {*} res Response object
 */
async function post_boats(req, res) {
    console.log('post_boats()');

    var json_web_token = await get_jwt(req);
    var userid = await validateJWT(json_web_token);
    console.log('' == true);
    console.log('' == false);
    console.log('userid = ' + userid);

    if (userid) {
        var boat = await db.createBoat({
            'name': req.body.name,
            'type': req.body.type,
            'length': Number(req.body.length),
            'public': Boolean(req.body.public),
            'owner': userid
        });
        if (!utils.isEmpty(boat)) {
            res.status(201).send(boat);
            return;
        }
    } else {
        console.log('invalid JWT. not creating the boat');
        res.status(401).send({'Error': 'Invalid or missing JWT.'});
        return;
    }
    res.status(500).send('Internal Error');
}

/**
 * 
 * @param {*} id - owner id
 */
async function get_public_boats(req, res) {
    console.log('get_public_boats()');
    var boats = await db.get_public_boats_by_owner(req.params.owner_id)
    res.status(200).send(boats);
}

/**
 * 
 * Returns all boats for ...
 *  - If the JWT in the Authorization header is valid, returns all boats for that user
 *  - If the JWT in the Authorization header is invalid/not provided, all public boats are returned
 * 
 * @param {*} req  Request object
 * @param {*} res  Response object
 */
async function get_boats(req, res) {
    var boats = [];
    var jwt = get_jwt(req);
    var owner = await validateJWT(jwt);

    // get boats for owner
    if (owner) {
        boats = await db.getBoatsByAttribute('owner', '=', owner);
    // get all public boats
    } else {
        boats = await db.getBoatsByAttribute('public', '=', true);
    }

    res.status(200).send(boats);
}

async function delete_boat(req, res) {
    console.log('delete_boat()');

    var jwt = await get_jwt(req);
    var owner_id = await validateJWT(jwt);

    // JWT is valid
    if (owner_id) {
        var boat = await db.getBoat(req.params.boat_id);
        console.log('retrieved boat:');
        console.log(boat);

        // boat found
        if (!utils.isEmpty(boat)) {
            console.log('boat owner = ' + boat.owner);
            console.log('owner_id = ' + owner_id);

            // boat owned by owner, delete it
            if (boat.owner == owner_id) {
                console.log('boat deleted? ' + await db.deleteBoat(boat.id));
                res.status(204).send();
                return;

            // boat owned by someone else
            } else {
                res.status(403).send();
                return;
            }

        // boat not found
        } else {
            res.status(403).send();
            return;
        }

    // missing or invalid JWT
    } else {
        res.status(401).send();
        return;
    }
}

module.exports = {
    post_boats,
    get_public_boats,
    get_boats,
    delete_boat
}
