module.exports = {
    "timeout": 30000,
    "patternLang": "en",
    "patterns": {        
        "en": {
            "messageSeparator": 'Location ([0-9]{1,3}), folder "([a-zA-Z]{3,})", ([a-zA-Z\- ]{3,}), ([a-zA-Z ]{3,})',
            "separatorAttributes": ['messageId', 'folder', 'storage', 'folderName'],
            "bodyDefinition": 'SMS message\nSMSC number[\s ]*: "([0-9\+]*)"\nSent[\s ]*: (.*)\nCoding[\s ]*: (.*)\nRemote number[\s ]*: "(.*)"\nStatus[\s ]*: (.*)\n\n(.*)',
            "bodyAttributes" : ["smsc", "sendDateStr", "encoding", "phoneNumber", "status", "message"]
        }
    }
}