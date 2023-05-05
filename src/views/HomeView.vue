<template>
  <div class="home">
    <div class="container">
      <div class="title">地图绘制区域功能（电子围栏）</div>
      <div class="desc">
        <div class="line">1.单区域新增，修改，撤销，删除功能（输入path对象 或 null，输出path对象）</div>
        <div class="line">2.多区域新增，修改，撤销，删除功能（输入path数组 或 []，输出path数组）</div>
        <div class="line">3.包含搜索功能</div>
        <div class="line">4.包含区域限定功能</div>
        <div class="line">5.包含用户帮助文档</div>
      </div>
      <div class="title">入参说明</div>
      <div class="table">
        <el-table :data="electronicFenceParams" style="width: 100%">
          <el-table-column prop="key" label="key值" width="180">
          </el-table-column>
          <el-table-column prop="type" label="参数类型" width="180">
          </el-table-column>
          <el-table-column prop="required" label="是否必填" width="180">
          </el-table-column>
          <el-table-column prop="default" label="默认值" width="180">
          </el-table-column>
          <el-table-column prop="desc" label="说明">
          </el-table-column>
        </el-table>
      </div>
      <div class="title">回调函数</div>
      <div class="table">
        <el-table :data="electronicFenceFn" style="width: 100%">
          <el-table-column prop="fn" label="函数名称" width="180">
          </el-table-column>
          <el-table-column prop="time" label="触发时机" width="180">
          </el-table-column>
          <el-table-column prop="returnData" label="返回对象">
            <template slot-scope="scope">
              <div v-for="item, index in scope.row.returnData" :key="index"><span style="color:#0079FE">{{ item.key
              }}</span>:{{ item.desc }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="desc" label="说明">
          </el-table-column>
        </el-table>
      </div>
      <div class="title">组件展示</div>
      <div class="componentFather">
        <electronic-fence :ifMultify="true" :needArea="true" :areaName="'上城区'" :areaLevel="'city'"
          :pathArr="[[[120.182202, 30.207287], [120.217427, 30.232262], [120.197308, 30.245258], [120.168812, 30.217671], [120.177052, 30.204023]], [[120.159324, 30.245445], [120.171482, 30.245189], [120.170296, 30.219568], [120.16822, 30.21739], [120.168961, 30.216236], [120.156358, 30.206883], [120.147313, 30.205729], [120.148055, 30.200475], [120.136638, 30.197912], [120.136934, 30.201372], [120.139455, 30.201757], [120.138565, 30.20432], [120.143162, 30.205729], [120.139307, 30.213289], [120.140641, 30.214186], [120.144496, 30.212264], [120.148055, 30.212777], [120.150427, 30.216493], [120.154134, 30.217902], [120.155024, 30.216108], [120.159472, 30.223411], [120.159027, 30.226999], [120.160065, 30.227767], [120.159175, 30.231226], [120.153986, 30.234557], [120.153986, 30.237375], [120.153986, 30.240194], [120.154431, 30.241731], [120.159324, 30.245445]]]"
          @completeArea="getPath"></electronic-fence>
      </div>
    </div>
  </div>
</template>

<script>
import electronicFence from '@/components/electronicFence.vue'
export default {
  name: 'HomeView',
  components: {
    electronicFence
  },
  data() {
    return {
      electronicFenceParams: [{
        key: 'ifMultify',
        type: 'Boolean',
        required: '非必填',
        default: 'false',
        desc: '是否多区域绘制（true:是，false：否）'
      }, {
        key: 'ifEdit',
        type: 'Boolean',
        required: '非必填',
        default: 'true',
        desc: '设定是否可编辑父级传入的节点，该参数不会影响新增节点的编辑（true:是，可以编辑旧的节点，false：否，不能编辑旧的节点）'
      }, {
        key: 'path',
        type: 'Array',
        required: '非必填',
        default: '[]',
        desc: '单区域路径参数（多区域没有pathArr，自动使用[path]）'
      }, {
        key: 'pathArr',
        type: 'Array',
        required: '非必填',
        default: '[]',
        desc: '多区域路径参数（多区域没有pathArr，自动使用[path]）'
      }, {
        key: 'width',
        type: 'String',
        required: '非必填',
        default: '100%',
        desc: '地图宽度（百分比/像素），父容器display:block'
      }, {
        key: 'height',
        type: 'String',
        required: '非必填',
        default: '600px',
        desc: '地图宽度（像素）,高度必填，如果需要地图自适应可以自己修改父容器position:absolute铺满组件的父容器，地图同理铺满地图父容器'
      }, {
        key: 'mapCenter',
        type: 'Array',
        required: '非必填',
        default: '[120.22, 30.31]',
        desc: '地图中心（默认为上城区中心）'
      }, {
        key: 'mapLevel',
        type: 'Number',
        required: '非必填',
        default: '11',
        desc: '地图放大等级（同官方文档）'
      }, {
        key: 'needSearch',
        type: 'Boolean',
        required: '非必填',
        default: 'true',
        desc: '是否需要地图搜索功能（默认需要）'
      }, {
        key: 'needArea',
        type: 'Boolean',
        required: '非必填',
        default: 'false',
        desc: '是否需要显示限定区域（此功能可以在地图上默认显示一片(城市/市级/省级)区域），和电子围栏功能无关'
      }, {
        key: 'areaName',
        type: 'String',
        required: '非必填',
        default: '无',
        desc: '限定区域名称，如上城区（须配合needArea使用）'
      }, {
        key: 'areaLevel',
        type: 'String',
        required: '非必填',
        default: 'city',
        desc: '限定区域层级，同地图省市层级（须配合needArea使用）'
      }, {
        key: '其他说明',
        type: '',
        required: '',
        default: '',
        desc: '跟地图有关的一些参数没有抽出来，比如使用地图必须的key(79fcd3e6f9a33363b1631157f74c864e)和securityJsCode(6143e5d9b1af7525e15f5959ec831a85)，有需要可以单独抽，也可以使用的时候自己改'
      }],
      electronicFenceFn: [{
        fn: 'completeDraw',
        returnData: [{
          key: 'originalAllData',
          desc: '地图上所有的path区域（可能包含父级和新增的区域）,该字段为高德地图原始数据'
        }, {
          key: 'normalAllData',
          desc: '地图上所有的path区域（可能包含父级和新增的区域），该字段仅包含经纬数据'
        }, {
          key: 'originalNewData',
          desc: '地图上新增的path区域,该字段为高德地图原始数据，没有新增的区域返回空数组，ifMultify为false的时候返回null'
        }, {
          key: 'normalNewData',
          desc: '地图上新增的path区域，该字段仅包含经纬数据，没有新增的区域返回空数组，ifMultify为false的时候返回null'
        }],
        time: '点击完成绘制按钮后触发',
        desc: '无'
      }]
    }
  },
  methods: {
    getPath(data) {
      console.log(data)
    }
  },
  mounted() {

  }
}
</script>
<style lang="less" scoped>
.home {
  padding: 20px;

  .container {
    padding: 20px;
    border: 1px solid #ccc;

    .title {
      font-size: 18px;
      font-weight: bold;
      margin: 20px 0;
    }

    .desc {
      margin: 20px 0;
      padding: 20px;
      color: rgba(0, 0, 0, .65);
      background: #F5F5F5;

      .line {
        margin: 12px 0;
      }
    }

    .componentFather {
      padding: 20px;
      border: 1px solid #ccc;
    }
  }
}
</style>

