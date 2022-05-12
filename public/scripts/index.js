//const { default: axios } = require('axios');
//const axios = require('axios');
//import axios from 'axios';

console.log('am I getting the new file? v8');

document.getElementById('oauth-form').addEventListener('submit', function(event){
    event.preventDefault()
    initiate_oauth();
});

async function initiate_oauth() {
    console.log('initiate_oauth()');
    var url = location.href +  'redirect_to_google_oauth'
    console.log(url);

    const headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
    }

    var response = await fetch(url, {
        method: 'POST',
        headers: headers,
        mode: 'no-cors',
        body: {}
    });
    var res_json = await response.json();
    
    console.log(res_json);
    setTimeout(() => {}, 5000);
    window.location = res_json['url'];
}