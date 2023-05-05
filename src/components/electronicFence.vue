<template>
  <!-- 地图绘制区域组件（董凯瑞） -->
  <div class="electronicFence">
    <div id="mapCtn" :style="{ 'height': heigth, 'width': width }"></div>
    <div class="ele-searchCtn">
      <el-autocomplete class="inline-input" v-model="searchValue" :fetch-suggestions="searchMap" placeholder="搜索区域"
        @select="selectMapSearch" :popper-append-to-body="false"></el-autocomplete>
    </div>
    <div class="ele-oprationCtn">
      <div class="ele-opr blue" @click="addArea" v-if="!(this.path.length === 1 && !this.ifMultify)">添加新区域</div>
      <div class="ele-opr red" @click="deleteArea">删除选中区域</div>
      <div class="ele-opr orange" @click="resetArea">撤销所有操作</div>
      <div class="ele-opr green" @click="completeArea">完成绘制</div>
      <el-popover placement="right" width="300" trigger="click" v-if="ifNeedHelp">
        <div class="ele-opr" slot="reference">帮助文档</div>
        <div class="ele-help">
          <div v-if="!(this.path.length === 1 && !this.ifMultify)" style="padding-left: 7em;position: relative;">
            <span style="position: absolute;left:0;color:#0079FE">添加新区域：</span>
            <span>点击此按钮后在地图留白区域单机左键即可绘制区域，完成区域绘制后双击左键来确认图形</span>
          </div>
          <div class="line" style="padding-left: 7em;position: relative;">
            <span style="position: absolute;left:0;color:#0079FE"> 删除选中区域：</span>
            <span>点击后删除当前选中的区域</span>
          </div>
          <div class="line" style="padding-left: 7em;position: relative;">
            <span style="position: absolute;left:0;color:#0079FE">撤销所有操作：</span>
            <span>点击后撤销所有操作，区域回初始状态</span>
          </div>
          <div class="line" style="padding-left: 7em;position: relative;">
            <span style="position: absolute;left:0;color:#0079FE">完成绘制：</span>
            <span>确认区域后点击此按钮完成本次操作</span>
          </div>
        </div>
      </el-popover>
    </div>
  </div>
</template>

<script>
import AMapLoader from "@amap/amap-jsapi-loader";
export default {
  props: {
    // 是否多区域
    ifMultify: {
      type: Boolean,
      required: false,
      default: false
    },
    // 是否可编辑父级传入的区域
    ifEdit: {
      type: Boolean,
      required: false,
      default: true
    },
    // 是否需要帮助文档
    ifNeedHelp: {
      type: Boolean,
      required: false,
      default: true
    },
    // 单区域路径参数--（多区域没有pathArr，自动使用[path]）
    path: {
      type: Array,
      required: false,
      default: () => []
    },
    // 多区域路径参数
    pathArr: {
      type: Array,
      required: false,
      default: () => []
    },
    // 地图CSS宽度(像素/百分比)
    width: {
      type: String,
      required: false,
      default: '100%'
    },
    // 地图CSS高度(像素)
    heigth: {
      type: String,
      required: false,
      default: '600px'
    },
    // 地图中心 -- 默认上城区中心[120.22, 30.31] 
    mapCenter: {
      type: Array,
      required: false,
      default: () => [120.22, 30.31]
    },
    // 地图放大等级 -- 默认11
    mapLevel: {
      type: Number,
      require: false,
      default: 11
    },
    // 是否需要搜索功能
    needSearch: {
      type: Boolean,
      required: false,
      default: true
    },
    // 限定搜索城市
    searchCity: {
      type: String,
      required: false,
      default: ''
    },
    // 是否需要显示限定区域
    needArea: {
      type: Boolean,
      required: false,
      default: false
    },
    // 限定区域名称（配合needArea使用）--如上城区
    areaName: {
      type: String,
      required: false,
    },
    // 限定区域层级（配合needArea使用）--同地图省市层级
    areaLevel: {
      type: String,
      required: false,
      default: 'city'
    },
  },
  data() {
    return {
      searchValue: '',
      placeSearch: null,
      polygonNow: null, // 当前选中的区域
      polygonList: [], // 地图上的所有区域（包含传入子组件的）
      polygonListNew: [] // 地图上新增的区域
    }
  },
  methods: {
    // 地图搜索功能
    searchMap(queryString, cb) {
      const that = this;
      if (!queryString) {
        return;
      }
      this.placeSearch.search(queryString, function (status, result) {
        // 搜索成功时，result即是对应的匹配数据
        if (status !== "complete") {
          that.$message.warning("未搜索到信息");
          cb([]);
        } else {
          cb(
            result.poiList.pois.map((item) => {
              return {
                value: item.name,
                lnglat: [item.location.lng, item.location.lat],
              };
            })
          );
        }
      });
    },
    selectMapSearch(val) {
      this.map.setCenter(val.lnglat)
      this.map.setZoom(16)
    },
    // 初始化区域（path，pathArr不为空的时候）
    initArea() {
      if (this.pathArr.length === 0 && this.path.length === 0) {
        return
      }
      const that = this
      let pathArr = []
      if (this.pathArr.length > 0) {
        pathArr = this.pathArr
      } else {
        pathArr = this.path.length > 0 ? [this.path] : []
      }
      if (pathArr.length > 0) {
        pathArr.forEach((item) => {
          var polygon = new AMap.Polygon({
            path: item,
            strokeColor: "#2a8ce7", //城市边界颜色
            strokeWeight: 3,
            fillColor: "#00051a", // 遮罩背景色黑色
            fillOpacity: 0.7,
          })
          this.polygonList.push(polygon)
          polygon.on("dblclick", () => {
            that.polygonNow = polygon
            that.polyEditor.setTarget(polygon)
            that.polyEditor.open()
          });
          this.map.add(polygon);
          // 如果只有一条path数据，默认进来直接编辑唯一一条数据
          if (pathArr.length === 1) {
            this.polyEditor.addAdsorbPolygons(polygon)
            this.polyEditor.setTarget(polygon)
            this.polyEditor.open()
            that.polygonNow = polygon
          }
        })

      }
    },
    // 添加区域
    addArea() {
      this.polyEditor.setTarget()
      this.polyEditor.open()
    },
    // 删除区域
    deleteArea() {
      let deleteIndex = -1
      this.polygonList.forEach((item, index) => {
        if (item === this.polygonNow) {
          deleteIndex = index
        }
        return item === this.polygonNow
      })
      if (deleteIndex > -1) {
        this.polygonList.splice(deleteIndex, 1)
      }
      deleteIndex = -1
      this.polygonListNew.forEach((item, index) => {
        if (item === this.polygonNow) {
          deleteIndex = index
        }
        return item === this.polygonNow
      })
      if (deleteIndex > -1) {
        this.polygonListNew.splice(deleteIndex, 1)
      }
      this.polygonNow.setMap(null)
      this.polyEditor.close()
    },
    // 完成绘制
    completeArea() {
      if (this.ifMultify) {
        this.$emit('completeArea', {
          originalAllData: this.polygonList, // 地图path原始+新增数据
          normalAllData: this.polygonList.map((item) => {
            return item.getPath().map((itemPath) => [itemPath.lng, itemPath.lat])
          }), // path对象转成普通二维数组，一般用于提交给后端
          originalNewData: this.polygonListNew, // 地图path新增数据
          normalNewData: this.polygonListNew.map((item) => {
            return item.getPath().map((itemPath) => [itemPath.lng, itemPath.lat])
          }),
        })
      } else {
        this.$emit('completeDraw', {
          originalAllData: this.polygonList[0], // 地图path原始数据
          normalAllData: this.polygonList[0].getPath().map((itemPath) => [itemPath.lng, itemPath.lat]),
          originalNewData: null, // 数据结构保持一致
          normalNewData: null
        })
      }
    },
    // 重置所有操作
    resetArea() {
      this.polygonList.forEach((item) => {
        item.setMap(null);
      })
      this.polyEditor.close();
      this.polygonList = []
      this.initArea()
    }
  },
  mounted() {
    const that = this
    AMapLoader.load({
      key: "79fcd3e6f9a33363b1631157f74c864e", // 申请好的Web端开发者Key，首次调用 load 时必填
      // 默认高德 sdk 版本为 1.4.4
      version: '2.0',
      AMapUI: {
        version: '1.1', // 引入AMapUI是为了轨迹组件使用
        // plugins: [], // 这里啥也不用配置，默认全部引入
      },
      plugins: ["AMap.MarkerCluster", "AMap.DistrictSearch", "AMap.PolygonEditor", "AMap.PlaceSearch",], // 需要使用的的插件列表
    }).then((AMap) => {
      that.map = new AMap.Map('mapCtn', {
        center: that.mapCenter,
        zoom: that.mapLevel,
        doubleClickZoom: false, // 禁用掉默认双击放大地图事件
      })
      // 搜索功能
      if (that.needSearch) {
        that.placeSearch = new AMap.PlaceSearch({
          city: that.searchCity,
        });
      }
      // 划区域功能
      if (that.needArea) {
        new AMap.DistrictSearch({
          extensions: "all",
          subdistrict: 0,
          level: that.areaLevel
        }).search(that.areaName, function (status, result) {
          const data = result.districtList[0].boundaries.map((item) => [item])
          const polygon = new AMap.Polygon({
            path: data,
            strokeColor: "#2a8ce7", //城市边界颜色
            strokeWeight: 3,
            fillColor: "#00051a", // 遮罩背景色黑色
            fillOpacity: 0.7,
            zIndex: 5 // 设置区域层级，防止点不到新增的区域，5是随便设置的
          });
          that.map.add(polygon)
          // 初始化入参区域
          that.initArea()
        })
      } else {
        that.initArea()
      }
      // 初始化区域可编辑
      that.polyEditor = new AMap.PolygonEditor(that.map);
      // 添加区域成功后使得该区域成为可编辑状态
      that.polyEditor.on("add", function (data) {
        let polygon = data.target;
        that.polyEditor.addAdsorbPolygons(polygon);
        that.polygonNow = polygon
        that.polygonListNew.push(polygon) // 记录下新增的区域
        that.polygonList.push(polygon)
        polygon.on("dblclick", () => {
          that.polygonNow = polygon
          that.polyEditor.setTarget(polygon);
          that.polyEditor.open();
        });
      });
    })
  }
}
</script>

<style lang="less" scoped>
.electronicFence {
  display: block;
  position: relative;

  .ele-oprationCtn {
    position: absolute;
    left: 20px;
    bottom: 20px;
    background: #fff;
    padding: 0 12px;
    border-radius: 4px;
    border: 1px solid #ccc;

    .ele-opr {
      line-height: 32px;
      padding: 0 12px;
      border-radius: 18px;
      border: 1px solid #ccc;
      margin: 12px 0;
      font-size: 14px;
      text-align: center;
      cursor: pointer;

      &.blue {
        background: #0079FE;
        color: #fff;
      }

      &.green {
        background: green;
        color: #fff;
      }

      &.red {
        background: #D9001B;
        color: #fff;
      }

      &.orange {
        background: #FF6A00;
        color: #fff;
      }
    }
  }

  .ele-searchCtn {
    position: absolute;
    top: 20px;
    left: 20px;
  }
}
</style>