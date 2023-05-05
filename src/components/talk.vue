<template>
  <!-- 语音对讲（董凯瑞） -->
  <div class="talk">
    <div class="talk-btn"
      :class="{ 'talk-blue': talkStatus === 0, 'talk-green': talkStatus === 1, 'talk-orange': talkStatus === 2 }"
      @click="talkOpration()">
      {{ talkStatus === 0 ? '开启对讲' : talkStatus === 1 ? '关闭对讲' : '重启对讲' }}</div>
  </div>
</template>

<script>
import VideoTalk from "@/assets/js/talk"
export default {
  props: {
    // 设备卡号，测试可以用公司设备：18202106177
    simId: {
      type: String,
      required: true,
      default: ''
    },
    // 设备端口号，测试设备用的端口号是4
    simChn: {
      type: Number,
      required: false,
      default: 4
    },
    // 写死，有需要传入
    videoIp: {
      type: String,
      required: false,
      default: '103.39.220.91'
    },
    // 写死，有需要传入
    videoPort: {
      type: String,
      required: false,
      default: '9988'
    },
    // 写死，有需要传入
    user: {
      type: String,
      required: false,
      default: 'BPHJ'
    },
  },
  data() {
    return {
      talk: null,
      talkStatus: 0,
      talkConnectFlag: false,
      micConnectFlag: false
    }
  },
  watch: {
    simId(val) {
      if (val && !this.talk) {
        this.initTalk()
      } else {
        this.talk.stop()
        this.talk.destroy()
        this.talk = null
        this.initTalk()
      }
    }
  },
  methods: {
    initTalk() {
      const that = this
      this.talk = new VideoTalk(this.videoIp, this.videoPort, this.user, {
        onTalkOk: function (tmn, chn) {
          console.log('对讲成功')
          that.talkConnectFlag = true
          if (that.micConnectFlag) {
            that.talkStatus = 1
          }
          that.$emit('afterTalkSuccess', {
            tmn,
            chn
          })
        },
        onTalkFail: function (tmn, chn, reason) {
          console.log('对讲失败')
          that.talkConnectFlag = false
          that.talkStatus = 2
          that.talk.stop()
          that.$emit('afterTalkFail', {
            tmn,
            chn,
            reason
          })
        },
        onMicOk: function (tmn, chn) {
          console.log('麦克风连接成功')
          that.micConnectFlag = true
          if (that.talkConnectFlag) {
            that.talkStatus = 1
          }
          that.$emit('afterMicSuccess', {
            tmn,
            chn,
          })
        },
        onMicFail: function (tmn, chn, reason) {
          console.log('麦克风连接失败')
          that.micConnectFlag = false
          that.talkStatus = 2
          that.talk.stop()
          that.$emit('afterMicFail', {
            tmn,
            chn,
            reason
          })
        }
      });
      if (this.talk.isSuport() !== true) {
        this.$emit('afterInitFail')
      } else {
        this.$emit('afterInitSuccess')
      }
    },
    talkOpration() {
      if (this.talkStatus === 0) {
        this.$emit('beforeTalkStart')
        if (this.talk) {
          this.talk.start(this.simId, this.simChn)
        } else {
          this.initTalk()
          this.talk.start(this.simId, this.simChn)
        }
      } else if (this.talkStatus === 1) {
        this.talk.stop()
        this.talkStatus = 0
      } else if (this.talkStatus === 2) {
        this.talk.stop()
        this.talk.destroy()
        this.talk = null
        this.initTalk()
        this.talk.start(this.simId, this.simChn)
      }
    }
  },
  beforeDestroy() {
    if (this.talk) {
      this.talk.destroy()
    }
  },
}
</script>

<style lang="less" scoped>
.talk {
  .talk-btn {
    display: inline-block;
    padding: 12px 20px;
    border: 1px solid #DCDFE6;
    border-radius: 4px;
    color: #fff;
    cursor: pointer;

    &.talk-blue {
      background: #409EFF;
    }

    &.talk-green {
      background: #71e2a3;
    }

    &.talk-orange {
      background: #E6A23C;
    }
  }
}
</style>