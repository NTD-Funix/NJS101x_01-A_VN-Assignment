const mongodb = require('mongodb');

const MongoClient = mongodb.MongoClient;

let _db;

const mongoConnect = (callback) => {
    const mongoUrl = 'mongodb+srv://NODEJS-ASM:Maithuhuyen5893@nodejs-asm.im399un.mongodb.net/employee?retryWrites=true&w=majority';
    MongoClient.connect(mongoUrl)
        .then(client => {
            console.log('Connected');
            _db = client.db();
            callback();
        })
        .catch(err => {
            console.log(err);
            throw err;
        });
};

const getDb = () => {
    if (_db) {
        return _db;
    }
    throw "No database found!";
};

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;


