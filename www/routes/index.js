var express = require('express');
var router = express.Router();
var low = require('lowdb')
var path = require('path');
var moment = require('moment');
var _ = require('lodash');

var db = low(path.join(__dirname, '../data/db2.json'), {
  storage: require('lowdb/lib/file-async')  // 使用异步存储
});
db.defaults({})

// 获取团队列表
router.get('/teams', function (req, res, next) {
  // 遍历对象的属性，返回每个属性的新值
  var teams = db.mapValues(function (item) {
    return {
      teamName: item.teamName
    }
  }).value();

  // 省略指定属性
  // var teams = db.omit(['apply']).value();

  // 选取指定属性
  // var teams = db.pick(['yypt']).value();

  // 删除指定路径的属性
  // var teams = db.unset('yypt.apply').value();  // => true

  res.json({
    err: 0,
    msg: '',
    data: teams
  })
});

// 新增团队
router.post('/team', function (req, res, next) {
  var token = req.headers.token;
  var teamId = req.body.teamId;
  var teamName = req.body.teamName;
  if(token !== '20160926'){
    res.json({
      err: 3,
      msg: '无权限'
    });
    return;
  }
  if(!teamId || !teamName){
    res.json({
      err: 1,
      msg: 'id或name为空'
    });
    return;
  }
  if(db.get(teamId).value()){
    res.json({
      err: 2,
      msg: '团队id已存在'
    });
    return;
  }
  var data = {
    teamName: teamName,
    apply: {}
  };
  db.set(teamId, data).value();
  res.json({
    err: 0,
    msg: '',
    data: data
  })
});

// 获取团队名称
router.get('/team/name', function (req, res, next) {
  var teamId = req.query.teamId
  var teamName = db.get(`${teamId}.teamName`).value();
  if(!teamName){
    res.json({
      err: 1,
      msg: '该团队不存在'
    })
    return;
  }
  res.json({
    err: 0,
    msg: '',
    data: {
      teamName: teamName
    }
  })
});

// 获取团队成员列表，仅返回当日已添加的成员
router.get('/team/apply', function (req, res, next) {
  var date = moment().format("YYYYMMDD").toString();
  var teamId = req.query.teamId;
  if(!db.has(teamId).value()){
    res.json({
      err: 1,
      msg: '该团队不存在'
    })
    return;
  }
  var apply = db.get(`${teamId}.apply.date${date}`, []).cloneDeep().reverse().value();
  res.json({
    err: 0,
    msg: '',
    data: apply
  });
});

// 新增团队成员
router.post('/team/apply', function (req, res, next) {
  var date = moment().format("YYYYMMDD").toString();
  var teamId = req.body.teamId;
  var userName = req.body.userName;
  if(!db.has(teamId).value()){
    res.json({
      err: 1,
      msg: '该团队不存在'
    })
    return;
  }
  if(!userName){
    res.json({
      err: 2,
      msg: '请输入姓名'
    });
    return;
  }
  db.update(`${teamId}.apply.date${date}`, function (users) {
    users = (users || []).filter(function (name) {
      return name !== userName
    });
    users.push(userName);
    return users;
  }).value();
  var apply = db.get(`${teamId}.apply.date${date}`).value();
  res.json({
    err: 0,
    msg: '',
    data: apply
  });
});

// 删除团队成员
router.delete('/team/apply', function (req, res, next) {
  var date = moment().format("YYYYMMDD").toString();
  var teamId = req.body.teamId;
  var userName = req.body.userName;
  if(!db.has(teamId).value()){
    res.json({
      err: 1,
      msg: '该团队不存在'
    })
    return;
  }
  if(!userName){
    res.json({
      err: 2,
      msg: '成员不存在'
    });
    return;
  }
  db.update(`${teamId}.apply.date${date}`, function (users) {
    users = (users || []).filter(function (name) {
      return name !== userName
    });
    return users;
  }).value();
  var apply = db.get(`${teamId}.apply.date${date}`).value();
  res.json({
    err: 0,
    msg: '',
    data: apply
  });
});

// 获取成员信息
router.get('/user', function (req, res, next) {
  var teamId = req.query.teamId;
  var userName = req.query.userName;
  if(!db.has(teamId).value()){
    res.json({
      err: 1,
      msg: '该团队不存在'
    })
    return;
  }
  if(!userName){
    res.json({
      err: 2,
      msg: '请输入姓名'
    });
    return;
  }
  var apply = db.get(`${teamId}.apply`).value();
  var count = [];
  _.each(apply, function (users, date) {
    if(!_.isArray(users)){
      users = [];
    }
    if(users.indexOf(userName) > -1){
      count.push(date.replace('date', ''));
    }
  });
  res.json({
    err: 0,
    msg: '',
    data: {
      count: count
    }
  })
});

module.exports = router;