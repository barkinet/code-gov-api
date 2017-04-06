/******************************************************************************

  FORMATTER: a service which formats json objects, adding new fields and mod-
  ifying existing ones as necessary for consumption by the API

******************************************************************************/

const _                   = require("lodash");
const moment              = require("moment");
const Utils               = require("../../utils");
const Logger              = require("../../utils/logger");
const request_promise     = require("request-promise");
const request             = require("request");

var licensename="";
var eventsfeed_projects = "";
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
class Formatter {

  constructor() {
    this.logger = new Logger({ name: "formatter" });
  }

  _formatDate(date) {
    return moment(date).toJSON();
  }

  _formatDates(repo) {
    if (repo.updated) {
      if (repo.updated.metadataLastUpdated) {
        repo.updated.metadataLastUpdated =
          this._formatDate(repo.updated.metadataLastUpdated);
      }
      if (repo.updated.lastCommit) {
        repo.updated.lastCommit =
          this._formatDate(repo.updated.lastCommit);
      }
      if (repo.updated.sourceCodeLastModified) {
        repo.updated.sourceCodeLastModified =
          this._formatDate(repo.updated.sourceCodeLastModified);
      }
    }
  }
  _formatLicense(repo){
  
    var license_array = new Array();
    
    var license_url = repo.repository;  
    if (repo.license!=null) {
      
    license_url = license_url.replace("//github.com/","//api.github.com/repos/");
      
     var options = {
     uri: license_url+"?client_id=" + process.env.CLIENT_ID + "&client_secret=" + process.env.CLIENT_SECRET,
     headers: { 
       'User-Agent':'request',
       'Accept': 'application/vnd.github.drax-preview+json'
     },
       json: true
   };
    request_promise(options).then( function(res){
      
        
          //console.log(body);
          
            if(res.license){
             // console.log("JSON body: "+JSON.stringify(res.license.name));
              
              //console.log("whats in license: "+(repo.license))
              licensename= res.license.name;
             // console.log("license name: "+licensename);
               //  repo.license=licensename;
              
              }
            
            
            
          }).catch(function (err){
      console.log("license error: "+err);
      
    });
          
      
    }
    return licensename; 
    
    
    

  
/*  
//OLD method of searching for a bunch of options for license file

license_array[0]= license_url+"/blob/master/LICENSE";
  license_array[1] = license_url+"/blob/master/LICENSE";
  license_array[2] = license_url+"/blob/master/LICENSE.TXT";
  license_array[3] = license_url+"/blob/master/LICENSE.MD";
  
  for (var i = 0; i < license_array.length; i++) {
      request(license_array[i], function (error, response, body) {
        if (!error && response.statusCode == 200) {
          //console.log(body);
          if (repo.license==null) {repo.license=license_array[i];}
          
          }
      })
  }
  */
    
}
  _formatEvents(repo) {
     // add event activity to repo for GitHub repos
 var eventsurl = repo.repository;
 var limit = 1,eventsfeed = [],
   eventsfeed_start, eventsfeed_end = ']';
   


 if (!eventsurl.includes("github.com")) {
   repo["events"] = [];
 } else {
   eventsurl = eventsurl.replace("https://github.com/", "https://api.github.com/repos/");
   eventsurl += "/events";

   var options = {
     url: eventsurl + "?client_id=" + process.env.CLIENT_ID + "&client_secret=" + process.env.CLIENT_SECRET,
     headers: {
       'User-Agent': 'request',
       'Accept': 'application/vnd.github.v3+json'
     }
   };

   
   request(options, function (err, response, body){
      if (err){
        
        console.log("event error: "+err);
      }
     else{
       if (response.statusCode==404 || response.statusCode==403){
         console.log ("url: \n"+options.url);
         console.log ("this is the body: \n"+body);
         console.log("type of body: "+typeof(JSON.parse(JSON.stringify(body))));
       body=JSON.parse(JSON.stringify(body));
     
      if (body.length>0 && body[0].type!=undefined) 
      { 
        console.log("size of body: "+body.length);
        console.log ("type of first entry: "+body[0].type);
       
       eventsfeed_start = "[";

       for (var i = 0; i < Math.min(limit, body.length); i++) {
         console.log("event type: "+body[i].type);
         eventsfeed_projects +=
           "{'id': '" + body[i].repo.id + "','name': '" + body[i].repo.name + "','type':'" +
           (body[i].type).replace("Event", "") + "','user':'" + body[i].actor.display_login +
           "','time': '" + body[i].created_at + "'";

         //loop through type of event
         if (body[i].type == "PushEvent")
         {

           eventsfeed_projects += ",'message': '" + body[i].payload.commits[0].message + "', 'url':'" + body[i].payload.commits[0].url + "'";



         } else if (body[i].type == "PullRequestEvent")

         {
           console.log(body[i].payload.pull_request.title);
           eventsfeed_projects += ",'message': '" + body[i].payload.pull_request.title + "', 'url':'" + body[i].payload.pull_request.url + "'";



         } 
         else if (body[i].type == "CreateEvent")

         {
           console.log(body[i].payload.ref);
           eventsfeed_projects += ",'message': '" + body[i].payload.ref_type + "', 'reference':'" + body[i].payload.ref + "'";



         } 
         else if (body[i].type == "IssueCommentEvent")

         {

           eventsfeed_projects += ",'message': '" + body[i].payload.issue.title + "', 'url':'" + body[i].payload.issue.url + "'";

         }
         else if (body[i].type == "IssuesEvent")

         {

           eventsfeed_projects += ",'message': '" + body[i].payload.issue.title + "', 'url':'" + body[i].payload.issue.url + "'";

         }
         else if (body[i].type == "WatchEvent")

         {

           eventsfeed_projects += ",'message': '" + body[i].payload.action + "', 'user':'" + body[i].actor.login + "'";

         }
          else if (body[i].type == "ForkEvent")

         {

           eventsfeed_projects += ",'message': '" + body[i].payload.forkee.full_name + "', 'description':'" + body[i].payload.forkee.description + "'";

         }
         eventsfeed_projects += "}";

         if (i + 1 <= Math.min(limit, body.length)) {
           eventsfeed_projects += ',';
         }
       }
       eventsfeed = eventsfeed_start + eventsfeed_projects + eventsfeed_end;
      }
      
      
     }
    }
    
   });
     
   
   //repo["events"] = eventsfeed + ']';
   //  repo.events=JSON.parse(eventsfeed);
   //repo["events"] = ['{y}'];

 } //else
sleep(Math.floor(Math.random()*(7000-2000+1)+2000)); 
return eventsfeed_projects;

   
  }

  _formatRepo(repo) {
    // add repoId using a combination of agency acronym, organization, and
    // project name fields
    let repoId = Utils.transformStringToKey([
      repo.agency.acronym,
      repo.organization,
      repo.name
    ].join("_"));
    repo["repoID"] = repoId;
    

    // remove `id` from agency object
    if (repo.agency && repo.agency.id) {
      delete repo.agency.id;
    }
    
    repo.license_name=this._formatLicense(repo);
    
    repo.events=this._formatEvents(repo);
    this._formatDates(repo);

    return repo;
  }

  formatRepo(repo, callback) {
    var formattedRepo;
    try {
      formattedRepo = this._formatRepo(repo);
    } catch (err) {
      this.logger.error(`Error when formatting repo: ${err}`);
      return callback(err, repo);
    }

    this.logger.info(`Formatted repo ${repo.name} (${repo.repoID}).`);
    return callback(null, repo);
  }

}

module.exports = new Formatter();
