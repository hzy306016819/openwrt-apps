'use strict';
'require baseclass';
'require rpc';

// 声明RPC调用
let callSystemInfo = rpc.declare({ object: 'system', method: 'info' });
let callSystemBoard = rpc.declare({ object: 'system', method: 'board' });
let callCPUUsage = rpc.declare({ object: 'luci', method: 'getCPUUsage' });
let callTempInfo = rpc.declare({ object: 'luci', method: 'getTempInfo' });

// 渲染标题
function renderTitle(title) {
  return E('div', { 
    style: 'font-size: 1.1rem; font-weight: bold; margin-bottom: 5px;' 
  }, title);
}

// 渲染实时信息
function renderRealTimeInfo(data) {
  const [, systeminfo, cpuusage, tempinfo] = data;
  const { uptime, load, memory } = systeminfo;
  const availableMem = memory.available ?? memory.free + memory.buffered;

  // 格式化负载信息
  let loadstr = Array.isArray(load) 
    ? '%.2f, %.2f, %.2f'.format(...load.map(v => v / 65535.0)) 
    : '';

  // 创建信息显示元素
  return E('div', { 
    style: 'display: grid; grid-gap: 10px; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));'
  }, [
    // CPU使用率
    E('div', { style: 'display: flex; align-items: center;' }, [
      E('img', { 
        style: 'width: 1.5rem; margin-right: 5px;',
        src: L.resource('icons/cpu.webp') 
      }),
      E('span', {}, `${cpuusage.cpuusage} (${loadstr})`)
    ]),
    
    // 内存使用
    E('div', { style: 'display: flex; align-items: center;' }, [
      E('img', { 
        style: 'width: 1.5rem; margin-right: 5px;',
        src: L.resource('icons/memory.webp') 
      }),
      E('span', {}, '%1024.2mB / %1024.2mB'.format(availableMem, memory.total))
    ]),
    
    // 温度
    tempinfo.tempinfo ? E('div', { style: 'display: flex; align-items: center;' }, [
      E('img', { 
        style: 'width: 1.5rem; margin-right: 5px;',
        src: L.resource('icons/thermometer.webp') 
      }),
      E('span', {}, tempinfo.tempinfo)
    ]) : '',
    
    // 运行时间
    E('div', { style: 'display: flex; align-items: center;' }, [
      E('img', { 
        style: 'width: 1.5rem; margin-right: 5px;',
        src: L.resource('icons/clock.webp') 
      }),
      E('span', {}, '%t'.format(uptime))
    ])
  ]);
}

// 主模块
return baseclass.extend({
  title: '',  // 不显示标题
  
  // 加载数据
  load: function() {
    return Promise.all([
      L.resolveDefault(callSystemBoard(), {}),
      L.resolveDefault(callSystemInfo(), {}),
      L.resolveDefault(callCPUUsage(), {}),
      L.resolveDefault(callTempInfo(), {})
    ]);
  },
  
  // 渲染界面
  render: function(data) {
    const title = data[0].model.replace(/ \(.+/, '');  // 提取设备型号
    return E('div', { style: 'margin-bottom: 15px;' }, [
      renderTitle(title),
      renderRealTimeInfo(data)
    ]);
  },
  
  // 每3秒刷新一次
  interval: 3000
});
