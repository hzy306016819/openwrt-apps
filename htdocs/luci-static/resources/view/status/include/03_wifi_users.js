'use strict';
'require baseclass';
'require dom';
'require fs';
'require rpc';
'require uci';
'require network';

// 配置存储
const overviewCfg = {};
const Store = {
  showRename: {}  // 记录哪些用户正在重命名
};

// 读取配置文件
function readOverviewConfig() {
  return L.resolveDefault(fs.read('/etc/overview.json', 'json'), {});
}

// 保存配置文件
function saveOverviewConfig() {
  fs.write('/etc/overview.json', JSON.stringify(overviewCfg, null, 2));
}

// 获取WiFi网络信息
function getWifiNetworks() {
  return network.getWifiNetworks().then(nets => {
    return Promise.all(nets.map(net => net.getAssocList().then(assoc => {
      net.assocList = assoc;
      return net;
    }));
  });
}

// 获取主机提示信息
function getHostHints() {
  return network.getHostHints();
}

// 渲染用户图标
function renderUserIcon(mac) {
  const defIcon = L.resource('icons/device/default.png');
  const iconPath = overviewCfg.users.icon[mac] || defIcon;
  return E('img', { 
    style: 'width: 32px; height: 32px; margin-right: 5px;',
    src: iconPath 
  });
}

// 渲染用户名称（可编辑）
function renderUserName(info) {
  const mac = info.mac;
  const currentName = overviewCfg.users.label[mac] || info.name;
  
  // 名称显示
  const nameDisplay = E('span', { 
    style: 'font-weight: bold; margin-right: 5px;' 
  }, currentName);
  
  // 重命名输入框
  const nameInput = E('input', { 
    class: 'cbi-input-text',
    style: 'display: none; width: 100px;',
    value: currentName
  });
  
  // 编辑按钮
  const editBtn = E('button', { 
    style: 'font-size: 0.8rem; padding: 0 5px;'
  }, '✏️');
  
  editBtn.addEventListener('click', () => {
    nameDisplay.style.display = 'none';
    nameInput.style.display = 'inline';
    nameInput.focus();
    Store.showRename[mac] = true;
  });
  
  // 输入框事件处理
  nameInput.addEventListener('blur', () => {
    const newName = nameInput.value.trim();
    if (newName && newName !== currentName) {
      overviewCfg.users.label[mac] = newName;
      nameDisplay.textContent = newName;
      saveOverviewConfig();
    }
    nameDisplay.style.display = 'inline';
    nameInput.style.display = 'none';
    Store.showRename[mac] = false;
  });
  
  nameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') nameInput.blur();
  });
  
  return E('div', { style: 'display: flex; align-items: center;' }, [
    nameDisplay,
    nameInput,
    editBtn
  ]);
}

// 渲染信号强度图标
function getSignalIcon(signal) {
  const q = Math.min(((signal + 110) / 70) * 100, 100);
  let filename;
  if (q == 0) filename = 'signal-0.png';
  else if (q < 25) filename = 'signal-0-25.png';
  else if (q < 50) filename = 'signal-25-50.png';
  else if (q < 75) filename = 'signal-50-75.png';
  else filename = 'signal-75-100.png';
  return L.resource(`icons/${filename}`);
}

// 渲染WiFi速率
function formatWiFiRate(rxtx) {
  return `${rxtx.rate / 1000} Mbit/s, ${rxtx.mhz} MHz`;
}

// 渲染用户断开按钮
function renderDisconnectButton(net, mac) {
  const btn = E('button', { 
    class: 'cbi-button cbi-button-remove',
    style: 'font-size: 0.7rem; padding: 0 5px;'
  }, _('Disconnect'));
  
  btn.addEventListener('click', () => {
    btn.disabled = true;
    net.disconnectClient(mac, true, 5, 5000).catch(err => {
      ui.addNotification(null, E('p', {}, _('Unable to disconnect: ') + err.message));
    }).finally(() => {
      btn.disabled = false;
    });
  });
  
  return btn;
}

// 渲染单个WiFi用户
function renderWifiUser(info) {
  return E('div', { 
    style: 'display: flex; padding: 5px; border-bottom: 1px solid #eee; align-items: center;'
  }, [
    renderUserIcon(info.mac),
    E('div', { style: 'flex-grow: 1;' }, [
      renderUserName(info),
      E('div', { style: 'font-size: 0.8rem;' }, [
        E('span', {}, info.ssid),
        E('span', { style: 'margin-left: 10px;' }, 
          `${info.signal} dBm`),
        E('br'),
        E('span', {}, 'IP: ' + (info.ip || '-')),
        E('span', { style: 'margin-left: 10px;' }, 
          'MAC: ' + info.mac),
        E('br'),
        E('span', {}, 'Rate: ' + formatWiFiRate(info.rx)),
        E('span', { style: 'margin-left: 10px;' }, 
          'Time: %t'.format(info.connected_time))
      ])
    ]),
    renderDisconnectButton(info.net, info.mac)
  ]);
}

// 主模块
return baseclass.extend({
  title: _('WiFi Users'),  // 显示"WiFi用户"标题
  
  // 加载数据
  load: function() {
    L.resolveDefault(uci.load('dhcp'));
    return Promise.all([
      readOverviewConfig(),
      getHostHints(),
      getWifiNetworks()
    ]);
  },
  
  // 渲染界面
  render: function(data) {
    const [cfg, hosts, networks] = data;
    Object.assign(overviewCfg, cfg);
    if (!overviewCfg.users) overviewCfg.users = { icon: {}, label: {} };
    
    // 收集所有WiFi用户
    const users = [];
    networks.forEach(net => {
      const ssid = net.getActiveSSID();
      net.assocList.forEach(bss => {
        users.push({
          mac: bss.mac,
          name: hosts.getHostnameByMACAddr(bss.mac) || '?',
          ssid: ssid,
          signal: bss.signal,
          ip: hosts.getIPAddrByMACAddr(bss.mac),
          rx: bss.rx,
          connected_time: bss.connected_time,
          net: net
        });
      });
    });
    
    // 按名称排序
    users.sort((a, b) => a.name.localeCompare(b.name));
    
    // 渲染用户列表
    return E('div', { style: 'margin-bottom: 15px;' }, [
      E('div', { 
        style: 'font-size: 0.9rem; margin-bottom: 5px;' 
      }, `WiFi Online: ${users.length}`),
      users.length > 0 
        ? E('div', {}, users.map(renderWifiUser))
        : E('div', { style: 'text-align: center;' }, 'No WiFi users connected')
    ]);
  },
  
  // 每3秒刷新一次
  interval: 3000
});
