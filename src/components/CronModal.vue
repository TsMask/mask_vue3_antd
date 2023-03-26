<template>
  <a-modal
    title="Cron表达式生成器"
    :visible="true"
    :body-style="{ padding: '0 24px' }"
  >
    <a-tabs tabPosition="top" type="line" :destroy-inactive-tab-pane="true">
      <a-tab-pane key="1" tab="秒">
        <a-radio-group size="small" v-model:value="second.cronEvery">
          <a-space direction="vertical" :size="18">
            <a-radio value="1">每一秒钟</a-radio>
            <a-radio value="2">
              每隔
              <a-input-number
                size="small"
                v-model:value="second.incrementIncrement"
                :min="1"
                :max="60"
                placeholder="1-60"
              ></a-input-number>
              秒执行，从
              <a-input-number
                size="small"
                v-model="second.incrementStart"
                :min="0"
                :max="59"
                placeholder="0-59"
              ></a-input-number>
              秒开始
            </a-radio>
            <a-radio value="3">
              周期从
              <a-input-number
                size="small"
                v-model="second.rangeStart"
                :min="1"
                :max="60"
                placeholder="1-60"
              ></a-input-number>
              到
              <a-input-number
                size="small"
                v-model="second.rangeEnd"
                :min="0"
                :max="59"
                placeholder="0-59"
              ></a-input-number>
              秒
            </a-radio>
            <a-radio value="4">具体秒数(可多选)</a-radio>
            <a-select
              v-model:value="second.specificSpecific"
              size="small"
              mode="multiple"
              style="width: 100%"
              placeholder="具体秒数(可多选)"
            >
              <a-select-option v-for="(_, i) in 60" :key="i" :value="i">
                {{ i }}
              </a-select-option>
            </a-select>
          </a-space>
        </a-radio-group>
      </a-tab-pane>
      <a-tab-pane key="2" tab="分钟">
        <a-radio-group size="small" v-model:value="minute.cronEvery">
          <a-space direction="vertical" :size="18">
            <a-radio value="1">每一分钟</a-radio>
            <a-radio value="2">
              每隔
              <a-input-number
                size="small"
                v-model:value="minute.incrementIncrement"
                :min="1"
                :max="60"
                placeholder="1-60"
              ></a-input-number>
              分钟执行，从
              <a-input-number
                size="small"
                v-model="minute.incrementStart"
                :min="0"
                :max="59"
                placeholder="0-59"
              ></a-input-number>
              分钟开始
            </a-radio>
            <a-radio value="3">
              周期从
              <a-input-number
                size="small"
                v-model="minute.rangeStart"
                :min="1"
                :max="60"
                placeholder="1-60"
              ></a-input-number>
              到
              <a-input-number
                size="small"
                v-model="minute.rangeEnd"
                :min="0"
                :max="59"
                placeholder="0-59"
              ></a-input-number>
              分钟
            </a-radio>
            <a-radio value="4">具体分钟数(可多选)</a-radio>
            <a-select
              v-model:value="minute.specificSpecific"
              size="small"
              mode="multiple"
              style="width: 100%"
              placeholder="具体分钟数(可多选)"
            >
              <a-select-option v-for="(_, i) in 60" :key="i" :value="i">
                {{ i }}
              </a-select-option>
            </a-select>
          </a-space>
        </a-radio-group>
      </a-tab-pane>
      <a-tab-pane key="3" tab="小时">
        <a-radio-group size="small" v-model:value="hour.cronEvery">
          <a-space direction="vertical" :size="18">
            <a-radio value="1">每一小时</a-radio>
            <a-radio value="2">
              每隔
              <a-input-number
                size="small"
                v-model:value="hour.incrementIncrement"
                :min="0"
                :max="23"
                placeholder="0-23"
              ></a-input-number>
              小时执行，从
              <a-input-number
                size="small"
                v-model="hour.incrementStart"
                :min="0"
                :max="23"
                placeholder="0-23"
              ></a-input-number>
              时开始
            </a-radio>
            <a-radio value="3">
              周期从
              <a-input-number
                size="small"
                v-model="hour.rangeStart"
                :min="0"
                :max="23"
                placeholder="1-23"
              ></a-input-number>
              到
              <a-input-number
                size="small"
                v-model="hour.rangeEnd"
                :min="0"
                :max="23"
                placeholder="0-23"
              ></a-input-number>
              小时
            </a-radio>
            <a-radio value="4">具体小时数(可多选)</a-radio>
            <a-select
              v-model:value="hour.specificSpecific"
              size="small"
              mode="multiple"
              style="width: 100%"
              placeholder="具体小时数(可多选)"
            >
              <a-select-option v-for="(_, i) in 24" :key="i" :value="i">
                {{ i }}
              </a-select-option>
            </a-select>
          </a-space>
        </a-radio-group>
      </a-tab-pane>
      <a-tab-pane key="4" tab="天">
        <a-radio-group size="small" v-model:value="day.cronEvery">
          <a-space direction="vertical" :size="18">
            <a-radio value="1">每一小时</a-radio>
            <a-radio value="2">
              每隔
              <a-input-number
                size="small"
                v-model:value="day.incrementIncrement"
                :min="0"
                :max="23"
                placeholder="0-23"
              ></a-input-number>
              天执行，从
              <a-input-number
                size="small"
                v-model="day.incrementStart"
                :min="0"
                :max="23"
                placeholder="0-23"
              ></a-input-number>
              日开始
            </a-radio>
            <a-radio value="3">
              周期从
              <a-input-number
                size="small"
                v-model="day.rangeStart"
                :min="0"
                :max="23"
                placeholder="1-23"
              ></a-input-number>
              到
              <a-input-number
                size="small"
                v-model="day.rangeEnd"
                :min="0"
                :max="23"
                placeholder="0-23"
              ></a-input-number>
              天
            </a-radio>
            <a-radio value="4">具体天数(可多选)</a-radio>
            <a-select
              v-model:value="day.specificSpecific"
              size="small"
              mode="multiple"
              style="width: 100%"
              placeholder="具体天数(可多选)"
            >
              <a-select-option v-for="(_, i) in 31" :key="i" :value="i">
                {{ i }}
              </a-select-option>
            </a-select>
          </a-space>
        </a-radio-group>

        <div class="tabBody">
          <a-radio-group v-model="day.cronEvery">
            <a-row>
              <a-radio value="1">每一天</a-radio>
            </a-row>
            <a-row>
              <a-radio value="2"
                >每隔
                <a-input-number
                  size="small"
                  v-model="week.incrementIncrement"
                  :min="1"
                  :max="7"
                ></a-input-number>
                周执行，从
                <a-select size="small" v-model="week.incrementStart">
                  <a-select-option
                    v-for="(val, index) in Array(7)"
                    :key="index"
                    :value="index + 1"
                    >{{ weekDays[index] }}</a-select-option
                  >
                </a-select>
                开始
              </a-radio>
            </a-row>

            <a-row>
              <a-radio class="long" value="4">具体星期几(可多选)</a-radio>
              <a-select
                style="width: 340px"
                size="small"
                mode="multiple"
                v-model="week.specificSpecific"
              >
                <a-select-option
                  v-for="(val, index) in Array(7)"
                  :key="index"
                  :value="index + 1"
                  >{{ weekDays[index] }}</a-select-option
                >
              </a-select>
            </a-row>

            <a-row>
              <a-radio value="6">在这个月的最后一天</a-radio>
            </a-row>
            <a-row>
              <a-radio value="7">在这个月的最后一个工作日</a-radio>
            </a-row>
            <a-row>
              <a-radio value="8"
                >在这个月的最后一个
                <a-select size="small" v-model="day.cronLastSpecificDomDay">
                  <a-select-option
                    v-for="(val, index) in Array(7)"
                    :key="index"
                    :value="index + 1"
                    >{{ weekDays[index] }}</a-select-option
                  >
                </a-select>
              </a-radio>
            </a-row>
            <a-row>
              <a-radio value="9">
                在本月底前
                <a-input-number
                  size="small"
                  v-model="day.cronDaysBeforeEomMinus"
                  :min="1"
                  :max="31"
                ></a-input-number>
                天
              </a-radio>
            </a-row>
            <a-row>
              <a-radio value="10"
                >最近的工作日（周一至周五）至本月
                <a-input-number
                  size="small"
                  v-model="day.cronDaysNearestWeekday"
                  :min="1"
                  :max="31"
                ></a-input-number>
                日
              </a-radio>
            </a-row>
            <a-row>
              <a-radio value="11"
                >在这个月的第
                <a-input-number
                  size="small"
                  v-model="week.cronNthDayNth"
                  :min="1"
                  :max="5"
                ></a-input-number>
                个
                <a-select size="small" v-model="week.cronNthDayDay">
                  <a-select-option
                    v-for="(val, index) in Array(7)"
                    :key="index"
                    :value="index + 1"
                    >{{ weekDays[index] }}</a-select-option
                  >
                </a-select>
              </a-radio>
            </a-row>
          </a-radio-group>
        </div>
      </a-tab-pane>
      <a-tab-pane key="5" tab="月">
        <div class="tabBody">
          <a-radio-group v-model="month.cronEvery">
            <a-row>
              <a-radio value="1">每一月</a-radio>
            </a-row>
            <a-row>
              <a-radio value="2"
                >每隔
                <a-input-number
                  size="small"
                  v-model="month.incrementIncrement"
                  :min="0"
                  :max="12"
                ></a-input-number>
                月执行，从
                <a-input-number
                  size="small"
                  v-model="month.incrementStart"
                  :min="0"
                  :max="12"
                ></a-input-number>
                月开始
              </a-radio>
            </a-row>
            <a-row>
              <a-radio class="long" value="3">具体月数(可多选)</a-radio>
              <a-select
                style="width: 354px"
                size="small"
                filterable
                mode="multiple"
                v-model="month.specificSpecific"
              >
                <a-select-option
                  v-for="(val, index) in Array(12)"
                  :key="index"
                  :value="index + 1"
                  >{{ index + 1 }}</a-select-option
                >
              </a-select>
            </a-row>
            <a-row>
              <a-radio value="4"
                >从
                <a-input-number
                  size="small"
                  v-model="month.rangeStart"
                  :min="1"
                  :max="12"
                ></a-input-number>
                到
                <a-input-number
                  size="small"
                  v-model="month.rangeEnd"
                  :min="1"
                  :max="12"
                ></a-input-number>
                月之间的每个月
              </a-radio>
            </a-row>
          </a-radio-group>
        </div>
      </a-tab-pane>
      <a-tab-pane key="6" tab="年">
        <div class="tabBody">
          <a-radio-group v-model="year.cronEvery">
            <a-row>
              <a-radio value="1">每一年</a-radio>
            </a-row>
            <a-row>
              <a-radio value="2"
                >每隔
                <a-input-number
                  size="small"
                  v-model="year.incrementIncrement"
                  :min="1"
                  :max="99"
                ></a-input-number>
                年执行，从
                <a-input-number
                  size="small"
                  v-model="year.incrementStart"
                  :min="2022"
                  :max="2119"
                ></a-input-number>
                年开始
              </a-radio>
            </a-row>
            <a-row>
              <a-radio class="long" value="3">具体年份(可多选)</a-radio>
              <a-select
                style="width: 354px"
                size="small"
                filterable
                mode="multiple"
                v-model="year.specificSpecific"
              >
                <a-select-option
                  v-for="(val, index) in Array(100)"
                  :key="index"
                  :value="2022 + index"
                  >{{ 2022 + index }}</a-select-option
                >
              </a-select>
            </a-row>
            <a-row>
              <a-radio value="4"
                >从
                <a-input-number
                  size="small"
                  v-model="year.rangeStart"
                  :min="2022"
                  :max="2119"
                ></a-input-number>
                到
                <a-input-number
                  size="small"
                  v-model="year.rangeEnd"
                  :min="2022"
                  :max="2119"
                ></a-input-number>
                年之间的每一年
              </a-radio>
            </a-row>
          </a-radio-group>
        </div>
      </a-tab-pane>
    </a-tabs>

    <!-- <div class="card-container">
        <div class="bottom">
          <a-input addon-before="结果预览：" v-model="this.cron" disabled />
        </div>
      </div> -->
  </a-modal>
</template>
<script lang="ts" setup>
// export default {
//   name: 'VueCron',
//   // eslint-disable-next-line vue/require-prop-types
//   props: ['data'],
//   data() {
//     return {
//       visible: true,
//       confirmLoading: false,
//       size: 'large',

//       result: {
//         second: {},
//         minute: {},
//         hour: {},
//         day: {},
//         week: {},
//         month: {},
//         year: {},
//       },

import { reactive } from 'vue';
let weekDays = ['一', '二', '三', '四', '五', '六', '日'].map(
  val => '星期' + val
);
//       defaultValue: {
let second = reactive({
  cronEvery: '',
  incrementStart: 3,
  incrementIncrement: 5,
  rangeStart: 1,
  rangeEnd: 0,
  specificSpecific: [],
});

let minute = reactive({
  cronEvery: '',
  incrementStart: 3,
  incrementIncrement: 5,
  rangeStart: 1,
  rangeEnd: 0,
  specificSpecific: [],
});
let hour = reactive({
  cronEvery: '',
  incrementStart: 3,
  incrementIncrement: 5,
  rangeStart: '0',
  rangeEnd: '0',
  specificSpecific: [],
});
let day = reactive({
  cronEvery: '',
  incrementStart: 1,
  incrementIncrement: '1',
  rangeStart: '',
  rangeEnd: '',
  specificSpecific: [],
  cronLastSpecificDomDay: 1,
  cronDaysBeforeEomMinus: 1,
  cronDaysNearestWeekday: 1,
});
let week = reactive({
  cronEvery: '',
  incrementStart: 1,
  incrementIncrement: 1,
  specificSpecific: [],
  cronNthDayDay: 1,
  cronNthDayNth: 1,
});
let month = reactive({
  cronEvery: '',
  incrementStart: 3,
  incrementIncrement: 5,
  rangeStart: 1,
  rangeEnd: 1,
  specificSpecific: [],
});
let year = reactive({
  cronEvery: '',
  incrementStart: 2022,
  incrementIncrement: 1,
  rangeStart: 2022,
  rangeEnd: 2119,
  specificSpecific: [],
});
//   label: '',
// },
//     };
//   },
//   computed: {
//     modalWidth() {
//       return 608;
//     },
//     secondsText() {
//       let seconds = '';
//       const cronEvery = this.result.second.cronEvery || '';
//       switch (cronEvery.toString()) {
//         case '1':
//           seconds = '*';
//           break;
//         case '2':
//           seconds =
//             this.result.second.incrementStart +
//             '/' +
//             this.result.second.incrementIncrement;
//           break;
//         case '3':
//           this.result.second.specificSpecific.map(val => {
//             seconds += val + ',';
//           });
//           seconds = seconds.slice(0, -1);
//           break;
//         case '4':
//           seconds =
//             this.result.second.rangeStart + '-' + this.result.second.rangeEnd;
//           break;
//       }
//       return seconds;
//     },
//     minutesText() {
//       let minutes = '';
//       const cronEvery = this.result.minute.cronEvery || '';
//       switch (cronEvery.toString()) {
//         case '1':
//           minutes = '*';
//           break;
//         case '2':
//           minutes =
//             this.result.minute.incrementStart +
//             '/' +
//             this.result.minute.incrementIncrement;
//           break;
//         case '3':
//           this.result.minute.specificSpecific.map(val => {
//             minutes += val + ',';
//           });
//           minutes = minutes.slice(0, -1);
//           break;
//         case '4':
//           minutes =
//             this.result.minute.rangeStart + '-' + this.result.minute.rangeEnd;
//           break;
//       }
//       return minutes;
//     },
//     hoursText() {
//       let hours = '';
//       const cronEvery = this.result.hour.cronEvery || '';
//       switch (cronEvery.toString()) {
//         case '1':
//           hours = '*';
//           break;
//         case '2':
//           hours =
//             this.result.hour.incrementStart +
//             '/' +
//             this.result.hour.incrementIncrement;
//           break;
//         case '3':
//           this.result.hour.specificSpecific.map(val => {
//             hours += val + ',';
//           });
//           hours = hours.slice(0, -1);
//           break;
//         case '4':
//           hours = this.result.hour.rangeStart + '-' + this.result.hour.rangeEnd;
//           break;
//       }
//       return hours;
//     },
//     daysText() {
//       let days = '';
//       const cronEvery = this.result.day.cronEvery || '';
//       switch (cronEvery.toString()) {
//         case '1':
//           break;
//         case '2':
//         case '4':
//         case '11':
//           days = '?';
//           break;
//         case '3':
//           days =
//             this.result.day.incrementStart +
//             '/' +
//             this.result.day.incrementIncrement;
//           break;
//         case '5':
//           this.result.day.specificSpecific.map(val => {
//             days += val + ',';
//           });
//           days = days.slice(0, -1);
//           break;
//         case '6':
//           days = 'L';
//           break;
//         case '7':
//           days = 'LW';
//           break;
//         case '8':
//           days = this.result.day.cronLastSpecificDomDay + 'L';
//           break;
//         case '9':
//           days = 'L-' + this.result.day.cronDaysBeforeEomMinus;
//           break;
//         case '10':
//           days = this.result.day.cronDaysNearestWeekday + 'W';
//           break;
//       }
//       return days;
//     },
//     weeksText() {
//       let weeks = '';
//       const cronEvery = this.result.day.cronEvery || '';
//       switch (cronEvery.toString()) {
//         case '1':
//         case '3':
//         case '5':
//           weeks = '?';
//           break;
//         case '2':
//           weeks =
//             this.result.week.incrementStart +
//             '/' +
//             this.result.week.incrementIncrement;
//           break;
//         case '4':
//           this.result.week.specificSpecific.map(val => {
//             weeks += val + ',';
//           });
//           weeks = weeks.slice(0, -1);
//           break;
//         case '6':
//         case '7':
//         case '8':
//         case '9':
//         case '10':
//           weeks = '?';
//           break;
//         case '11':
//           weeks =
//             this.result.week.cronNthDayDay +
//             '#' +
//             this.result.week.cronNthDayNth;
//           break;
//       }
//       return weeks;
//     },
//     monthsText() {
//       let months = '';
//       const cronEvery = this.result.month.cronEvery || '';
//       switch (cronEvery.toString()) {
//         case '1':
//           months = '*';
//           break;
//         case '2':
//           months =
//             this.result.month.incrementStart +
//             '/' +
//             this.result.month.incrementIncrement;
//           break;
//         case '3':
//           this.result.month.specificSpecific.map(val => {
//             months += val + ',';
//           });
//           months = months.slice(0, -1);
//           break;
//         case '4':
//           months =
//             this.result.month.rangeStart + '-' + this.result.month.rangeEnd;
//           break;
//       }
//       return months;
//     },
//     yearsText() {
//       let years = '';
//       const cronEvery = this.result.year.cronEvery || '';
//       switch (cronEvery.toString()) {
//         case '1':
//           years = '*';
//           break;
//         case '2':
//           years =
//             this.result.year.incrementStart +
//             '/' +
//             this.result.year.incrementIncrement;
//           break;
//         case '3':
//           this.result.year.specificSpecific.map(val => {
//             years += val + ',';
//           });
//           years = years.slice(0, -1);
//           break;
//         case '4':
//           years = this.result.year.rangeStart + '-' + this.result.year.rangeEnd;
//           break;
//       }
//       return years;
//     },
//     cron() {
//       return `${this.secondsText || '*'} ${this.minutesText || '*'} ${
//         this.hoursText || '*'
//       } ${this.daysText || '*'} ${this.monthsText || '*'} ${
//         this.weeksText || '?'
//       } ${this.yearsText || '*'}`;
//     },
//   },
//   watch: {
//     visible: {
//       handler() {
//         const label = this.data;
//         if (label) {
//           this.secondsReverseExp(label);
//           this.minutesReverseExp(label);
//           this.hoursReverseExp(label);
//           this.daysReverseExp(label);
//           this.daysReverseExp(label);
//           this.monthsReverseExp(label);
//           this.yearReverseExp(label);
//           JSON.parse(JSON.stringify(label));
//         } else {
//           this.result = JSON.parse(JSON.stringify(this.defaultValue));
//         }
//       },
//     },
//   },
//   methods: {
//     show() {
//       this.visible = true;
//     },
//     handleSubmit() {
//       this.$emit('ok', this.cron);
//       this.close();
//       this.visible = false;
//     },
//     close() {
//       this.visible = false;
//     },
//     secondsReverseExp(seconds) {
//       const val = seconds.split(' ')[0];
//       const second = {
//         cronEvery: '',
//         incrementStart: 3,
//         incrementIncrement: 5,
//         rangeStart: 1,
//         rangeEnd: 0,
//         specificSpecific: [],
//       };
//       switch (true) {
//         case val.includes('*'):
//           second.cronEvery = '1';
//           break;
//         case val.includes('/'):
//           second.cronEvery = '2';
//           second.incrementStart = val.split('/')[0];
//           second.incrementIncrement = val.split('/')[1];
//           break;
//         case val.includes(','):
//           second.cronEvery = '3';
//           second.specificSpecific = val.split(',').map(Number).sort();
//           break;
//         case val.includes('-'):
//           second.cronEvery = '4';
//           second.rangeStart = val.split('-')[0];
//           second.rangeEnd = val.split('-')[1];
//           break;
//         default:
//           second.cronEvery = '1';
//       }
//       this.result.second = second;
//     },
//     minutesReverseExp(minutes) {
//       const val = minutes.split(' ')[1];
//       const minute = {
//         cronEvery: '',
//         incrementStart: 3,
//         incrementIncrement: 5,
//         rangeStart: 1,
//         rangeEnd: 0,
//         specificSpecific: [],
//       };
//       switch (true) {
//         case val.includes('*'):
//           minute.cronEvery = '1';
//           break;
//         case val.includes('/'):
//           minute.cronEvery = '2';
//           minute.incrementStart = val.split('/')[0];
//           minute.incrementIncrement = val.split('/')[1];
//           break;
//         case val.includes(','):
//           minute.cronEvery = '3';
//           minute.specificSpecific = val.split(',').map(Number).sort();
//           break;
//         case val.includes('-'):
//           minute.cronEvery = '4';
//           minute.rangeStart = val.split('-')[0];
//           minute.rangeEnd = val.split('-')[1];
//           break;
//         default:
//           minute.cronEvery = '1';
//       }
//       this.result.minute = minute;
//     },
//     hoursReverseExp(hours) {
//       const val = hours.split(' ')[2];
//       const hour = {
//         cronEvery: '',
//         incrementStart: 3,
//         incrementIncrement: 5,
//         rangeStart: 1,
//         rangeEnd: '0',
//         specificSpecific: [],
//       };
//       switch (true) {
//         case val.includes('*'):
//           hour.cronEvery = '1';
//           break;
//         case val.includes('/'):
//           hour.cronEvery = '2';
//           hour.incrementStart = val.split('/')[0];
//           hour.incrementIncrement = val.split('/')[1];
//           break;
//         case val.includes(','):
//           hour.cronEvery = '3';
//           hour.specificSpecific = val.split(',').map(Number).sort();
//           break;
//         case val.includes('-'):
//           hour.cronEvery = '4';
//           hour.rangeStart = val.split('-')[0];
//           hour.rangeEnd = val.split('-')[1];
//           break;
//         default:
//           hour.cronEvery = '1';
//       }
//       this.result.hour = hour;
//     },
//     daysReverseExp(cron) {
//       const days = cron.split(' ')[3];
//       const weeks = cron.split(' ')[5];
//       const day = {
//         cronEvery: '',
//         incrementStart: 1,
//         incrementIncrement: 1,
//         rangeStart: 1,
//         rangeEnd: 1,
//         specificSpecific: [],
//         cronLastSpecificDomDay: 1,
//         cronDaysBeforeEomMinus: 1,
//         cronDaysNearestWeekday: 1,
//       };
//       const week = {
//         cronEvery: '',
//         incrementStart: 1,
//         incrementIncrement: 1,
//         specificSpecific: [],
//         cronNthDayDay: 1,
//         cronNthDayNth: '1',
//       };
//       if (!days.includes('?')) {
//         switch (true) {
//           case days.includes('*'):
//             day.cronEvery = '1';
//             break;
//           case days.includes('?'):
//             break;
//           case days.includes('/'):
//             day.cronEvery = '3';
//             day.incrementStart = days.split('/')[0];
//             day.incrementIncrement = days.split('/')[1];
//             break;
//           case days.includes(','):
//             day.cronEvery = '5';
//             day.specificSpecific = days.split(',').map(Number).sort();
//             break;
//           case days.includes('LW'):
//             day.cronEvery = '7';
//             break;
//           case days.includes('L-'):
//             day.cronEvery = '9';
//             day.cronDaysBeforeEomMinus = days.split('L-')[1];
//             break;
//           case days.includes('L'):
//             if (days.len === 1) {
//               day.cronEvery = '6';
//               day.cronLastSpecificDomDay = '1';
//             } else {
//               day.cronEvery = '8';
//               day.cronLastSpecificDomDay = Number(days.split('L')[0]);
//             }
//             break;
//           case days.includes('W'):
//             day.cronEvery = '10';
//             day.cronDaysNearestWeekday = days.split('W')[0];
//             break;
//           default:
//             day.cronEvery = '1';
//         }
//       } else {
//         switch (true) {
//           case weeks.includes('/'):
//             day.cronEvery = '2';
//             week.incrementStart = weeks.split('/')[0];
//             week.incrementIncrement = weeks.split('/')[1];
//             break;
//           case weeks.includes(','):
//             day.cronEvery = '4';
//             week.specificSpecific = weeks.split(',').map(Number).sort();
//             break;
//           case '#':
//             day.cronEvery = '11';
//             week.cronNthDayDay = weeks.split('#')[0];
//             week.cronNthDayNth = weeks.split('#')[1];
//             break;
//           default:
//             day.cronEvery = '1';
//             week.cronEvery = '1';
//         }
//       }
//       this.result.day = day;
//       this.result.week = week;
//     },
//     monthsReverseExp(cron) {
//       const months = cron.split(' ')[4];
//       const month = {
//         cronEvery: '',
//         incrementStart: 3,
//         incrementIncrement: 5,
//         rangeStart: 1,
//         rangeEnd: 1,
//         specificSpecific: [],
//       };
//       switch (true) {
//         case months.includes('*'):
//           month.cronEvery = '1';
//           break;
//         case months.includes('/'):
//           month.cronEvery = '2';
//           month.incrementStart = months.split('/')[0];
//           month.incrementIncrement = months.split('/')[1];
//           break;
//         case months.includes(','):
//           month.cronEvery = '3';
//           month.specificSpecific = months.split(',').map(Number).sort();
//           break;
//         case months.includes('-'):
//           month.cronEvery = '4';
//           month.rangeStart = months.split('-')[0];
//           month.rangeEnd = months.split('-')[1];
//           break;
//         default:
//           month.cronEvery = '1';
//       }
//       this.result.month = month;
//     },
//     yearReverseExp(cron) {
//       const years = cron.split(' ')[6];
//       const year = {
//         cronEvery: '',
//         incrementStart: 3,
//         incrementIncrement: 5,
//         rangeStart: 2021,
//         rangeEnd: 2021,
//         specificSpecific: [],
//       };
//       switch (true) {
//         case years.includes('*'):
//           year.cronEvery = '1';
//           break;
//         case years.includes('/'):
//           year.cronEvery = '2';
//           year.incrementStart = years.split('/')[0];
//           year.incrementIncrement = years.split('/')[1];
//           break;
//         case years.includes(','):
//           year.cronEvery = '3';
//           year.specificSpecific = years.split(',').map(Number).sort();
//           break;
//         case years.includes('-'):
//           year.cronEvery = '4';
//           year.rangeStart = years.split('-')[0];
//           year.rangeEnd = years.split('-')[1];
//           break;
//         default:
//           year.cronEvery = '1';
//       }
//       this.result.year = year;
//     },
//   },
// };
</script>

<style lang="less"></style>
