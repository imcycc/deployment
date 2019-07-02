var express = require('express');
var router = express.Router();
const { spawn, } = require('child_process');
var tokenUtils = require('../../utils/tokenUtils');
var responseUtils = require('../../utils/responseUtils');
var projectStatusServices = require('../../services/projectStatusServices');

/* POST publish listing. */
router.post('/', function (req, res, next) {
  tokenUtils.getProfile(req, res, (err, data) => {
    if (err) return;
    let params = {
      id: req.body.id,
    }
    projectStatusServices.query(params, (err, project) => {
      projectStatusServices.updateById({ ...params, status: '进行中' })
        .then(() => {
          let syncFile = spawn('sh', [`./public/shell/${project[0].shellName}`]);

          syncFile.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
          });

          syncFile.stderr.on('data', (data) => {
            projectStatusServices.updateById({ ...params, status: '失败' })
            console.log(`stderr:${data}`)
          })

          syncFile.on('close', (code) => {
            projectStatusServices.updateById({ ...params, status: '完成' })
            console.log(`子进程退出码：${code}`)
          })
        })
        .catch(err => {
          res.send(responseUtils.fail(SERVER_ERROR, err));
        })
    })

    res.send(responseUtils.success());
  })

})

module.exports = router;
