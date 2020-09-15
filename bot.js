const Discord = require('discord.io');
const logger = require('winston');
const btoa = require('btoa');
const auth = require('./auth.json');
const fetch = require('node-fetch');
const { Console } = require('winston/lib/winston/transports');

//Blizzard oAuth Credentials
const oauth = {
    client: '62725435245a4461b3c9e030852e4599',
    secret: 'pgAAlChdEUWUxMVLj6LLNQdVZVKOSHkB'
}
const oauthClient = '62725435245a4461b3c9e030852e4599';
const oauthSecret = 'pgAAlChdEUWUxMVLj6LLNQdVZVKOSHkB';

let oauthToken = '';
let testPeriod = 'testperiod';
const serverID = '59';
const serverName = 'malganis';
const connectedRealm = '3684';
let rosterArray = [];
let needsHelp = [];

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});

const getNestedObject = (nestedObj, pathArr) => {
    return pathArr.reduce((obj, key) =>
        (obj && obj[key] !== 'undefined') ? obj[key] : undefined, nestedObj);
}

async function getOAuth() {
    const basicAuth = btoa(`${oauthClient}:${oauthSecret}`);
    let bodyParams = {
        redirect_uri: 'https://localhost',
        //code: 'pgAAlChdEUWUxMVLj6LLNQdVZVKOSHkB',
        scope: 'wow.profile',
        grant_type: 'client_credentials',
        client_id: oauthClient,
        client_secret: oauthSecret
        //response_type: 'code'
    }
    let headerParams = {
        //authorization: `Basic ${basicAuth}`,
        
    }
    let requestOptions = {
        method: 'POST',
        body: {
        //code: 'pgAAlChdEUWUxMVLj6LLNQdVZVKOSHkB',
        // scope: 'wow.profile',
        grant_type: 'client_credentials'},
        // client_id: oauthClient,
        // client_secret: oauthSecret},
        headers: 
        {Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded'}
        
    }
    console.log(basicAuth);
    // response = await fetch(`https://us.battle.net/oauth/authorize?access_type=online&client_id=${oauthClient}&response_type=code`, {method: 'POST'});
    response = await fetch(`https://us.battle.net/oauth/token?grant_type=client_credentials`, requestOptions);
    return response.json();
}
async function getData(endpoint) {
    //Calls a URL for a json response
    response = await fetch(endpoint,{method: 'GET'});
    return response.json();
}

function getLeaderboards(period, token) {
    getData(`https://us.api.blizzard.com/data/wow/connected-realm/${connectedRealm}/mythic-leaderboard/244/period/${period}?namespace=dynamic-us&locale=en_US&access_token=${token}`, 'GET')
                        .then(data => {
                            console.log(data);
                            console.log(period);

                            var test = 1
                            data.leading_groups.forEach(group => {
                            // if (group.members.profile.name == 'Xellusmage') {
                            //     console.log(group.members);
                            // }
                            console.log('group ' + group.ranking);
                            console.log(test);
                            test++;
                            let profile = getNestedObject(group, ['members', 0, 'profile']);
                            if (profile.name == 'Xellusmage') {
                                console.log(profile.name);
                            }
                        })
                        console.log('finished');
                }).catch(err => {
                    console.log(err);
                });
}

function getRoster() {
    getData(`https://us.api.blizzard.com/data/wow/guild/malganis/darude-bonestorm/roster?namespace=profile-us&locale=en_US&access_token=${oauthToken}`, 'GET')
                .then(data => {
                    console.log(data.members[0].rank);
                    data.members.forEach(member => rosterArray.push(member));
                    console.log(rosterArray[4].character.name);
                }).catch(err => {
                    console.log(err);
                })
}

async function getWeeklyMythicList(name) {
                
                 await getData(`https://raider.io/api/v1/characters/profile?region=us&realm=malganis&name=${name}&fields=mythic_plus_weekly_highest_level_runs`, 'GET')
                    .then(data => {
                        if ((data.mythic_plus_weekly_highest_level_runs[0].mythic_level < 15 && (data.mythic_plus_weekly_highest_level_runs[1].mythic_level < 15 || data.mythic_plus_weekly_highest_level_runs[1].mythic_level == 'undefined') && (data.mythic_plus_weekly_highest_level_runs[2].mythic_level < 15 || data.mythic_plus_weekly_highest_level_runs[2].mythic_level == 'undefined')) || data.mythic_plus_weekly_highest_level_runs[0].mythic_level == 'undefined' || data == 'undefined') {
                            needsHelp.push(member.character.name);
                        };
                    }).catch(err => {
                        needsHelp.push(member.character.name);
                        console.log(needsHelp);
                        
                    })
                
                console.log(needsHelp);
}

bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
    getOAuth()
    .then(response => {
            
            oauthToken = response.access_token;
            console.log(oauthToken);
            getRoster();
        })
        .catch((error) => {
            console.log(error);
    });
    
});

bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
       
        args = args.splice(1);
        switch(cmd) {
            // !ping
            case 'ping':
                bot.sendMessage({
                    to: channelID,
                    message: 'Pong!' + user
                });
            break;
            case 'ding':
                bot.sendMessage({
                    to: channelID,
                    message: 'Dong!'
                });
            break;
            case '?':
                if (user != 'Guildbot') {
                bot.sendMessage({
                    to: channelID,
                    message: 'Available commands: \n !ding \n !ping'
                })
            }
            case 'affixes':
                // fetch and print the weekly affixes
                let affixes = [];
                getData('https://raider.io/api/v1/mythic-plus/affixes?region=us&locale=en').then(data => {
                    data.affix_details.forEach(detail => {
                        affixes.push(detail.name);
                    });
                let affixMessage = affixes.join(', ');
                bot.sendMessage({
                    to:channelID,
                    message: 'This weeks affixes: ' + affixMessage
                })
                });
            break;
            case 'leaderboard':
                console.log(oauthToken);
                
                getData(`https://us.api.blizzard.com/data/wow/mythic-keystone/period/index?namespace=dynamic-us&locale=en_US&access_token=${oauthToken}`, 'GET')
                .then(data => {
                    console.log(data.current_period.id);
                    getLeaderboards(data.current_period.id, oauthToken);

                }).catch(err => {
                    console.log(err);
                })
                

            break;
            case 'WeeklyM+':
                //takes the current guild roster and fetches their best runs for the week.
                let needsHelp = [];
                rosterArray.forEach(member => {
                    getData(`https://raider.io/api/v1/characters/profile?region=us&realm=${serverName}&name=${member.character.name}&fields=mythic_plus_weekly_highest_level_runs`, 'GET')
                    .then(data => {
                        // if all runs are below 15, add to list to print
                        if ((data.mythic_plus_weekly_highest_level_runs[0].mythic_level < 15 && (data.mythic_plus_weekly_highest_level_runs[1].mythic_level < 15 || data.mythic_plus_weekly_highest_level_runs[1].mythic_level == 'undefined') && (data.mythic_plus_weekly_highest_level_runs[2].mythic_level < 15 || data.mythic_plus_weekly_highest_level_runs[2].mythic_level == 'undefined')) || data.mythic_plus_weekly_highest_level_runs[0].mythic_level == 'undefined' || data == 'undefined') {
                            needsHelp.push(member.character.name);
                        };
                        // print list if last element in array
                        if (rosterArray.indexOf(member) == (rosterArray.length - 1)){
                        let messageArray = []
                        needsHelp.forEach(instance => {
                            messageArray.push('\n' + instance)
                        })
                        messageArray = messageArray.join('');
                        bot.sendMessage({
                            to:channelID,
                            message: 'These people need M+ runs:' + messageArray
                        })
                        }
                    }).catch(err => {
                        //if a character doesn't have runs, add them to list
                        needsHelp.push(member.character.name);
                        //print list if last element in array
                        if (rosterArray.indexOf(member) == (rosterArray.length - 1)){
                            let messageArray = []
                        needsHelp.forEach(instance => {
                            messageArray.push('\n' + instance)
                        })
                        messageArray = messageArray.join('');
                        bot.sendMessage({
                            to:channelID,
                            message: 'These people need M+ runs:' + messageArray
                        })
                            }
                        
                    })
                })
                
                
         }
     }
});
