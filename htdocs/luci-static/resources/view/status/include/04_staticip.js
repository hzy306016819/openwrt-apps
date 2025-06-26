// Copyright 2024 wsk170 <wsk170@gmail.com>
// Licensed to the GNU General Public License v3.0.

'use strict';
'require baseclass';
'require dom';
'require fs';
'require rpc';
'require uci';
'require network';
'require poll';

const Store = {
  showUsers: true,
  iconFiles: []
};

// 使用 RPC 获取网络设备信息
let callNetworkDevices = rpc.declare({
  object: 'luci-rpc',
  method: 'getNetworkDevices',
  expect: { '': {} }
});

function getStaticIPHosts() {
  return uci.load('dhcp').then(() => {
    const hosts = [];
    uci.sections('dhcp', 'host', (host) => {
      if (host.ip) {
        const macs = host.mac ? (Array.isArray(host.mac) ? host.mac : [host.mac] : [];
        macs.forEach(mac => {
          hosts.push({
            name: host.name || 'Unknown',
            ip: host.ip,
            mac: mac.toUpperCase(),
            leasetime: host.leasetime || '12h'
          });
        });
      }
    });
    return hosts;
  });
}

function getOnlineUsers() {
  const params = ['-4', 'neigh', 'show', 'dev', 'br-lan'];
  return fs.exec('/sbin/ip', params).then((res) => {
    const users = new Set();
    const lines = res.stdout.trim().split(/\n/);
    lines.forEach((line) => {
      const [ip, addr, mac] = line.split(/\s+/);
      if (addr === 'lladdr') users.add(mac.toUpperCase());
    });
    return users;
  });
}

function getTrafficStats() {
  // 使用 RPC 替代 network.getNetworkDevices
  return callNetworkDevices().then((devices) => {
    const stats = { tx_bytes: 0, rx_bytes: 0 };
    Object.values(devices).forEach((dev) => {
      if (dev.name === 'br-lan' && dev.stats) {
        stats.tx_bytes = dev.stats.tx_bytes || 0;
        stats.rx_bytes = dev.stats.rx_bytes || 0;
      }
    });
    return stats;
  });
}

function renderTitle(title, users, collapseID) {
  const css = {
    box: `
      position: sticky; top: 1px;
      display: flex; align-items: center;
      height: 36px; margin-bottom: 5px;
      box-shadow: 0 5px 5px -5px rgba(230, 230, 250, 0.8);
    `,
    title: `font-size: 1.1rem; font-weight: bold; margin-right: 5px;`,
    users: `font-size: 1.1rem; font-weight: bold; color: LimeGreen;`,
    fill: 'flex: 1;',
    button: `
      font-size: 20px;
      margin: 0 2px; padding: 0;
      border: none !important; border-radius: 3px;
      background: transparent;
    `
  };

  const symbol = Store.showUsers ? '⏫' : '⏬';
  const collapseBtn = E('button', { style: css.button }, symbol);
  collapseBtn.addEventListener('click', () => {
    Store.showUsers = !Store.showUsers;
    const section = document.getElementById(collapseID);
    section.style.display = Store.showUsers ? 'grid' : 'none';
    section.style.opacity = Store.showUsers ? 1 : 0;
    collapseBtn.innerHTML = Store.showUsers ? '⏫' : '⏬';
    const title = document.getElementById('staticip-title');
    const titlePos = title.getBoundingClientRect();
    let scrollTop = titlePos.top < 10 ? 1 : titlePos.top - titlePos.height - 5;
    window.scrollTo({ top: scrollTop, left: 0, behavior: 'smooth' });
  });

  return E('div', { id: 'staticip-title', style: css.box }, [
    E('div', { style: css.title }, title + ':'),
    E('div', { style: css.users }, users),
    E('div', { style: css.fill }, ''),
    collapseBtn
  ]);
}

function renderUserBox(host, online, traffic) {
  const css = {
    box: `
      display: flex; align-items: center;
      height: 100%;
      padding: 7px;
      border-radius: 5px;
      box-shadow: inset 0px 0px 3px LightGray;
    `,
    icon: `
      width: 64px !important; height: 64px !important;
      border: none !important;
      border-radius: 7px;
      box-shadow: none !important;
      background: transparent;
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      transition: none !important;
    `,
    infoBox: 'padding-left: 7px; width: 100%;',
    symbolBox: `
      display: flex; align-items: center;
      height: 22px;
    `,
    symbol: `
      min-width: 22px;
      text-align: center;
      font-size: 0.9rem;
    `,
    text: `
      width: 100%;
      margin-left: 3px;
      font-size: 0.8rem;
    `,
    highlight: `
      padding: 0 3px;
      margin-left: 10px;
      border-radius: 2px;
      box-shadow: 0 0 3px rgb(82, 168, 236);
      font-size: 0.7rem;
      font-weight: bold;
      font-family: "Times New Roman", Times, serif;
    `
  };

  const iconPath = online ? 
    L.resource('icons/device/default.png') : 
    L.resource('icons/device/default-1.png');

  return E('div', { style: css.box }, [
    E('div', { style: css.icon, 'background-image': `url(${iconPath})` }),
    E('div', { style: css.infoBox }, [
      E('div', { style: css.symbolBox }, [
        E('div', { style: css.symbol }, '🏷️'),
        E('div', { style: css.text }, host.name),
        E('div', { style: css.highlight }, host.leasetime)
      ]),
      E('div', { style: css.symbolBox }, [
        E('div', { style: css.symbol }, '🌐'),
        E('div', { style: css.text }, host.ip)
      ]),
      E('div', { style: css.symbolBox }, [
        E('div', { style: css.symbol }, 'Ⓜ️'),
        E('div', { style: css.text }, host.mac)
      ]),
      E('div', { style: css.symbolBox }, [
        E('div', { style: css.symbol }, '🔽'),
        E('div', { style: css.text }, '%1024.2mB/s'.format(traffic.rx_bytes))
      ]),
      E('div', { style: css.symbolBox }, [
        E('div', { style: css.symbol }, '🔼'),
        E('div', { style: css.text }, '%1024.2mB/s'.format(traffic.tx_bytes))
      ])
    ])
  ]);
}

return baseclass.extend({
  title: _('Static IP Users'),

  load: function () {
    return Promise.all([
      getStaticIPHosts(),
      getOnlineUsers(),
      getTrafficStats()
    ]);
  },

  render: function (data) {
    const [hosts, onlineUsers, traffic] = data;
    const users = hosts.map(host => {
      const online = onlineUsers.has(host.mac);
      return renderUserBox(host, online, traffic);
    });

    const css = {
      box: 'position: relative',
      grid: `
        display: ${Store.showUsers ? 'grid' : 'none'};
        grid-gap: 7px 7px;
        grid-template-columns: repeat(auto-fit, minmax(330px, 1fr));
        transition: opacity 0.3s ease, display 0.3s ease allow-discrete;
        margin-bottom: 1rem;
      `
    };

    return E('div', { style: css.box }, [
      renderTitle(_('Static IP Users'), users.length, 'staticip-users'),
      E('div', { id: 'staticip-users', style: css.grid }, users)
    ]);
  }
});