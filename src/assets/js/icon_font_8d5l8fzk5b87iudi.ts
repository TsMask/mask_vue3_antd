/**
 * 字体图标文件-静态资源文件路径
 */
const baseUrl = import.meta.env.VITE_HISTORY_BASE_URL;
export const scriptUrl = `${
  baseUrl.length === 1 && baseUrl.indexOf('/') === 0
    ? ''
    : baseUrl.indexOf('/') === -1
    ? '/' + baseUrl
    : baseUrl
}/font_8d5l8fzk5b87iudi.js`;

/**
 * 读取 font_8d5l8fzk5b87iudi.js 文件内svg图标名称
 *
 * JSON.stringify(txt.match(/icon-(\S*)"/gi).map(i=>i.slice(0,-1)))
 */
export const iconFonts = [
  '#',
  'icon-alibaba',
  'icon-alimama',
  'icon-aliyun',
  'icon-anzhuo',
  'icon-biaoqing',
  'icon-chexiao',
  'icon-chexiao2',
  'icon-daimayingyong',
  'icon-daishenhe',
  'icon-dashang',
  'icon-dianzan',
  'icon-dianzan1',
  'icon-facebook',
  'icon-fangda',
  'icon-fangda2',
  'icon-fanhui',
  'icon-fanhui1',
  'icon-fankui1',
  'icon-fenxiang',
  'icon-fuzhichenggong',
  'icon-fuzhidaima',
  'icon-fuzhidaima1',
  'icon-gengduo',
  'icon-gerenzhanghu',
  'icon-github',
  'icon-gonggao',
  'icon-gonggaodayi',
  'icon-gongnengjieshao',
  'icon-gouwuche',
  'icon-gouwuche2',
  'icon-guanbi',
  'icon-huidingbu',
  'icon-huifu',
  'icon-huizhiguize',
  'icon-iconfont1',
  'icon-ios',
  'icon-jieshi',
  'icon-jinggao',
  'icon-lishi',
  'icon-morentouxiang',
  'icon-paixu',
  'icon-pcduan',
  'icon-piliang',
  'icon-qingchu',
  'icon-qq',
  'icon-qunzhu',
  'icon-right',
  'icon-saoyisao',
  'icon-shanchu',
  'icon-shang',
  'icon-shang1',
  'icon-shang2',
  'icon-shangchuan',
  'icon-shenhejujue',
  'icon-shenhetongguo',
  'icon-shijian',
  'icon-shuoming',
  'icon-souren',
  'icon-sousuo',
  'icon-soutubiao',
  'icon-suofang',
  'icon-suoxiao',
  'icon-suoxiao2',
  'icon-taobaowang',
  'icon-tengxunwang',
  'icon-tianjiachengyuan',
  'icon-tianmao',
  'icon-tubiaohuizhi',
  'icon-tubiaoku',
  'icon-tuichu',
  'icon-twitter',
  'icon-weibo',
  'icon-weibo1',
  'icon-weibo2',
  'icon-weijiaru',
  'icon-weitijiao',
  'icon-weixin',
  'icon-wenjian',
  'icon-wocanyu',
  'icon-wofaqi',
  'icon-xia',
  'icon-xia2',
  'icon-xiangmu',
  'icon-xiangmuchengyuan',
  'icon-xiangxia',
  'icon-xiangxia1',
  'icon-xiangxia2',
  'icon-xiangyou',
  'icon-xiaomi',
  'icon-xiazai',
  'icon-xinjiantubiaoku',
  'icon-yingwen',
  'icon-you',
  'icon-you1',
  'icon-you2',
  'icon-youxiang',
  'icon-youxuan',
  'icon-youxuan2',
  'icon-yuzhanghao',
  'icon-yuzhanghao1',
  'icon-zhifubao',
  'icon-zhizuoliucheng',
  'icon-zhongguodianxin',
  'icon-zhuanrang',
  'icon-zhubajie',
  'icon-zuo',
  'icon-zuo1',
  'icon-zuo2',
  'icon-zuoxuan',
  'icon-zuoxuan2',
];
