<template>
  <Row class="container">
    <Col :sm="24" :lg="{span: 13, offset: 3}" :md="{span: 16, offset: 1}" class="card-bottom">
      <div class="ivu-card ivu-card-bordered">
        <div class="ivu-card-head">
          <h2><i class="ivu-icon ivu-icon-chatbubbles" style="color: rgb(25, 190, 107);"></i> Chat Room</h2>
        </div>
        <div class="ivu-card-body" id="message-panel"> 
          <message v-for="(m, index) in received" :name="m.nick" :message="m.message" :key="index"></message>
        </div>
        <div class="ivu-card-body footer">
            <Input v-model="message" type="textarea" :row="1" :autosize="{minRows: 1, maxRows: 3}" placeholder="按Enter发送" @keydown.native="sendMsg($event)"></Input>
        </div>
      </div>
    </Col>
    <Col :sm="24" :lg="{span: 4, offset: 1}" :md="{span: 5, offset: 1}">
      <Row class="card-bottom">
        <Card>
          <h3 slot="title">
            <Icon type="information-circled" color="#ff9900"></Icon> 我的
          </h3>
          <Form :label-width="80">
            <FormItem label="Nick Name:">
              <Input type="text" v-model="user.nick" @on-blur="modifyNick" @keyup.enter.native="modifyNick" /> 
            </FormItem>
          </Form>
        </Card>
      </Row>
      <Row>
        <Card>
          <h3 slot="title">
            <Icon type="person-stalker" color="#2d8cf0"></Icon> 在线
          </h3>
          <div v-for="u in online" :key="u.id + u.nick" class="avatar">
            <Avatar v-if="u.nick == 'Anonymous' " icon="person" />
            <Avatar v-else :class="genAvatarClass(u.nick)">{{ u.nick | firstChar }}</Avatar> {{ u.nick }}
          </div>
        </Card>
      </Row>
    </Col>
  </Row>
</template>
<script>
import message from './message.vue'
import io from 'socket.io-client'
import config from '../config/config.js'
const EVTS = {
  connection: 'connection',
  join: 'join',
  disconnect: 'disconnect',
  message: 'message',
  users: 'users',
  modifyNick: 'modifyNick',
  notify: 'notify'
}
export default {
  name: 'mainPanel',
  components: {
    message
  },
  mounted () {
    this.socket = io(config.url);
    console.log(config.url);
    // 通知处理
    this.socket.on(EVTS.notify, data => {
      let notify = JSON.parse(data);
      this.$Notice.open({
        title: notify.title,
        desc: notify.content
      });
    });
    // 获取id
    this.socket.on(EVTS.join, id => {
      this.user.id = id
    });

    // 处理消息
    this.socket.on(EVTS.message, (data) => {
      this.received.push(JSON.parse(data));

    });
    // 在线用户
    this.socket.on(EVTS.users, data => {
      let len = this.online.length;
      this.online.splice(0, len, ...JSON.parse(data));
    });

    this.socket.on(EVTS.connection, () => {
      // 加入聊天
      this.socket.emit(EVTS.join, this.user.nick);
    });
    
  },
  updated () {
    this.$nextTick(function(){
      let div = document.getElementById('message-panel');
      div.scrollTop = div.scrollHeight;
    })
  },
  data () {
    return {
      id: null,
      user: {
        nick: window.localStorage.getItem('nickname') || 'Anonymous',
        id: null
      },
      message: '',
      socket: null,
      online: [],
      received: []
    }
  },
  methods: {
    sendMsg (event) {
      if (event.keyCode !== 13)
        return;
      event.preventDefault();
      if (!this.message.trim())
        return;
      this.socket.send(JSON.stringify({nick: this.user.nick, message: this.message}));
      this.message = ''
    },
    modifyNick () {
      // localStorage存储昵称
      window.localStorage.setItem('nickname', this.user.nick)
      this.socket.emit(EVTS.modifyNick, this.user.nick)
    },
    genAvatarClass (nick) {
      let className = 'avatar-color-' + (nick.charCodeAt(0) % 2)
      return {
        [className]: true
      }
    }
  },
  filters: {
    firstChar (value) {
      return value.slice(0, 1)
    }
  }
}
</script>
<style>
.container {
  margin-top: 10px;
}
#message-panel {
  height: 550px;
  overflow-y: auto;
}
.footer {
  border-top: 1px solid #e9eaec;
}
.card-bottom {
  margin-bottom: 10px;
}
.avatar {
  margin-bottom: 5px;
}
.avatar-color-0 {
  color: #f56a00 !important;
  background-color: #fde3cf !important;
}
.avatar-color-1 {
  color: #c6e7bd !important;
  background-color: #b1bfec !important;
}
</style>


