'use strict';
'require baseclass';
'require fs';
'require rpc';
'require uci';
'require network';

// 获取静态主机配置
function getStaticHosts() {
  return uci.load('dhcp').then(() => {
    const hosts = [];
    uci.sections('dhcp', 'host', host => {
      hosts.push({
        name: host.name,
        mac: host.mac,
        ip: host.ip,
        leasetime: host.leasetime || 'infinite'
      });
    });
    return hosts;
  });
}

// 获取网络设备统计信息
function getNetworkStats() {
  return network.getNetworkDevices().then(devs => {
    const stats = {};
    Object.values(devs).forEach(dev => {
      if (dev.stats) {
        stats[dev.name] = {
          tx: dev.stats.tx_bytes,
          rx: dev.stats.rx_bytes
        };
      }
    });
    return stats;
  });
}

// 渲染静态主机
function renderStaticHost(host, stats) {
  return E('div', { 
    style: 'display: flex; padding: 5px; border-bottom: 1px solid #eee; align-items: center;'
  }, [
    E('img', { 
      style: 'width: 32px; height: 32px; margin-right: 5px;',
      src: L.resource('icons/device/default.png')
    }),
    E('div', { style: 'flex-grow: 1;' }, [
      E('div', { style: 'font-weight: bold;' }, host.name),
      E('div', { style: 'font-size: 0.8rem;' }, [
        E('span', {}, 'IP: ' + host.ip),
        E('span', { style: 'margin-left: 10px;' }, 
          'MAC: ' + host.mac),
        E('br'),
        E('span', {}, 'Lease: ' + host.leasetime),
        E('span', { style: 'margin-left: 10px;' }, 
          'Traffic: ↑ %1024.1mB ↓ %1024.1mB'.format(
            stats.tx || 0, stats.rx || 0))
      ])
    ]),
    E('button', { 
      class: 'cbi-button cbi-button-edit',
      style: 'font-size: 0.7rem; padding: 0 5px;'
    }, _('Edit'))
  ]);
}

// 主模块
return baseclass.extend({
  title: _('Static Hosts'),  // 显示"静态主机"标题
  
  // 加载数据
  load: function() {
    return Promise.all([
      getStaticHosts(),
      getNetworkStats()
    ]);
  },
  
  // 渲染界面
  render: function(data) {
    const [hosts, stats] = data;
    
    return E('div', { style: 'margin-bottom: 15px;' }, [
      E('div', { 
        style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;'
      }, [
        E('div', { 
          style: 'font-size: 0.9rem;' 
        }, `Static Hosts: ${hosts.length}`),
        E('button', { 
          class: 'cbi-button cbi-button-add',
          style: 'font-size: 0.8rem; padding: 0 10px;'
        }, _('Add'))
      ]),
      hosts.length > 0 
        ? E('div', {}, hosts.map(host => renderStaticHost(host, stats[host.ip] || {})))
        : E('div', { style: 'text-align: center;' }, 'No static hosts configured')
    ]);
  },
  
  // 每3秒刷新一次
  interval: 3000
});
