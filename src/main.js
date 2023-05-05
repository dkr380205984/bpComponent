import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
Vue.use(ElementUI);
import AMap from '@vuemap/vue-amap';
import '@vuemap/vue-amap/dist/style.css'
Vue.use(AMap);
AMap.initAMapApiLoader({
  key: '79fcd3e6f9a33363b1631157f74c864e',
  version: '2.0', // 非必填，不填时默认为2.0
  plugins: [], // 加载JS时同步加载的插件，此处加载的插件可以全局使用，示例 ['AMap.Scale']
  AMapUI: {
    version: '1.1',
    plugins:[]  
  }, // 加载UI插件，默认为空，不加载AMapUI
  Loca: {
      version: '2.0.0'
  }, // 加载LOCA的版本，默认加载并且版本为2.0.0
  serviceHost: '', // 代理服务器域名或ip地址，新版本密钥必须配置代理服务器或者安全密钥，优先使用该配置
  securityJsCode: '6143e5d9b1af7525e15f5959ec831a85', // 静态安全密钥，新版本在控制台创建应用时会同时提供安全密钥，当初始化不提供安全密钥或者安全代理时，部分服务不能使用，比如搜索、自定义地图样式
  offline: false, // 是否离线加载JS,当配置为true时，不执行loader功能，这时候需要自己在html的head中配置高德地图的script
});


Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
