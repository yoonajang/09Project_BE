const multer = require('multer');
const multerS3 = require('multer-s3-transform');
const sharp = require('sharp');

const AWS = require('aws-sdk');
const path = require('path');
AWS.config.loadFromPath(__dirname + '/s3config.json');

const s3 = new AWS.S3();

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'nbbang-resizing/w_200',
        limits: {
            fileSize: 2 * 1024 * 1024,
        },
        acl: 'public-read-write',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        shouldTransform: true,
        transforms: [
            {
              id: 'original',
              key: function (req, file, cb) {
                let extension = path.extname(file.originalname);
                cb(null, Date.now().toString() + '_origin' + extension);
              },
              transform: function (req, file, cb) {
                cb(null, sharp().jpeg());
              }, 
            },
            {
              id: 'resized',
              key: function (req, file, cb) {
                let extension = path.extname(file.originalname);
                cb(null, Date.now().toString() + '_resized' + extension);
              },
              transform: function (req, file, cb) {
                cb(null, sharp().resize({ width: 200 }));
              },
            },
        ],
    }),
});
   
// const profile = multer({
//   //   storage: multerS3({
//       s3: s3,
//       bucket: 'nbbang-resizing/bread-profile',
//       acl: 'public-read',
//       contentType: multerS3.AUTO_CONTENT_TYPE,
//       metadata: function(req, file, cb) {
//         cb(null, {fieldName: file.fieldname});
//       },
//       key: function (req, file, cb) {
//           cb(null, `contents/${Date.now()}_${file.originalname}`);
//       }
// })

module.exports = upload;
// module.exports = profile;
