'use strict';
'require baseclass';
'require rpc';
'require network';

// 声明RPC调用
let callSwconfigPortState = rpc.declare({
  object: 'luci',
  method: 'getSwconfigPortState',
  params: ['switch'],
  expect: { result: [] }
});

let callLuciBoardJSON = rpc.declare({
  object: 'luci-rpc',
  method: 'getBoardJSON',
  expect: { '': {} }
});

let callLuciNetworkDevices = rpc.declare({
  object: 'luci-rpc',
  method: 'getNetworkDevices',
  expect: { '': {} }
});

// 格式化端口速度
function formatSpeed(speed) {
  if (!speed || speed <= 0) return '-';
  return speed < 1000 ? `${speed} M` : `${speed / 1000} GbE`;
}

// 获取端口颜色
function getPortColor(carrier, duplex) {
  if (!carrier) return 'Gainsboro';
  return duplex === 'full' ? 'greenyellow' : 'darkorange';
}

// 渲染端口状态
function renderPorts(data) {
  const [board, netdevs, switches] = data;
  const ports = [];
  
  // 获取WAN和LAN设备
  const wan = netdevs[board.network.wan.device];
  const lan = netdevs['br-lan'];
  
  // 添加WAN端口
  if (wan) {
    ports.push({
      name: 'WAN',
      carrier: wan.link.carrier,
      speed: formatSpeed(wan.link.speed),
      tx: wan.stats.tx_bytes,
      rx: wan.stats.rx_bytes
    });
  }
  
  // 添加LAN端口
  if (lan) {
    ports.push({
      name: 'LAN',
      carrier: lan.link.carrier,
      speed: formatSpeed(lan.link.speed),
      tx: lan.stats.tx_bytes,
      rx: lan.stats.rx_bytes
    });
  }
  
  // 渲染端口显示
  return E('div', { 
    style: 'display: grid; grid-gap: 10px; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));'
  }, ports.map(port => {
    const color = getPortColor(port.carrier, true);
    return E('div', { style: 'text-align: center;' }, [
      E('div', { 
        style: `background-color: ${color}; border-radius: 5px 5px 0 0;`
      }, port.name),
      E('div', { 
        style: 'border: 1px solid lightgrey; border-radius: 0 0 5px 5px; padding: 5px;'
      }, [
        E('div', {}, port.speed),
        E('div', { style: 'font-size: 0.8rem;' }, [
          '↑ %1024.1mB'.format(port.tx || 0),
          E('br'),
          '↓ %1024.1mB'.format(port.rx || 0)
        ])
      ])
    ]);
  }));
}

// 主模块
return baseclass.extend({
  title: _('Port status'),  // 显示"端口状态"标题
  
  // 加载数据
  load: function() {
    return Promise.all([
      L.resolveDefault(callLuciBoardJSON(), {}),
      L.resolveDefault(callLuciNetworkDevices(), {}),
      network.getSwitchTopologies()
    ]);
  },
  
  // 渲染界面
  render: function(data) {
    return renderPorts(data);
  },
  
  // 每3秒刷新一次
  interval: 3000
});
