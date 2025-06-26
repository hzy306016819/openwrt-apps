'use strict';
'require baseclass';
'require rpc';

let showInfo = true;

let callSystemInfo = rpc.declare({ object: 'system', method: 'info' });
let callSystemBoard = rpc.declare({ object: 'system', method: 'board' });
let callCPUUsage = rpc.declare({ object: 'luci', method: 'getCPUUsage' });
let callTempInfo = rpc.declare({ object: 'luci', method: 'getTempInfo' });

function renderTitle(title) {
  const css = {
    title: `font-size: 1.1rem; font-weight: bold;`,
  };
  return E('div', { style: css.title }, title)
}

function renderRealTimeInfo(data) {
  const css = {
    box: `
      display: ${showInfo ? 'grid' : 'none'};
      grid-gap: 0 10px;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      margin: 5px 0;
      transition: opacity 0.3s ease, display 0.3s ease allow-discrete;
    `,
    flex: `
      display: flex; align-items: center; font-size: 0.8rem;
      box-shadow: 0 -3px 3px -3px rgb(82, 168, 236);
    `,
    icon: `
      width: 1.5rem; margin: 5px 5px;
      background: transparent;
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
    `,
    cpuusage: 'margin-right: 1rem; color: LimeGreen; font-weight: bold;',
    uptime: 'margin-left: 1rem; color: LimeGreen; font-weight: bold;',
    availableMem: 'color: LimeGreen;'
  };

  const [, systeminfo, cpuusage, tempinfo] = data;
  const { localtime, uptime, load, memory } = systeminfo;
  const availableMem = memory.available ?? memory.free + memory.buffered;

  let loadstr = '';
  if (Array.isArray(load)) {
    loadstr = '%.2f, %.2f, %.2f'.format(...load.map((v) => v / 65535.0));
  }

  let datestr = '';
  if (localtime) {
    const date = new Date(localtime * 1000);
    datestr = '%04d-%02d-%02d %02d:%02d:%02d'.format(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds()
    );
  }

  const box = E('div', { id: 'system-info', style: css.box }, [
    E('cpuusage', { style: css.flex }, [
      E('img', { style: css.icon, src: L.resource('icons/cpu.webp') }),
      E('span', { style: css.cpuusage }, cpuusage.cpuusage),
      E('span', { style: css.text }, loadstr)
    ]),
    E('memory', { style: css.flex }, [
      E('img', { style: css.icon, src: L.resource('icons/memory.webp') }),
      E('span', { style: css.availableMem }, '%1024.2mB'.format(availableMem)),
      E('span', { style: css.text }, '/%1024.2mB'.format(memory.total))
    ]),
    tempinfo.tempinfo ?
      E('temperature', { style: css.flex }, [
        E('img', { style: css.icon, src: L.resource('icons/thermometer.webp') }),
        E('span', { style: css.text }, tempinfo.tempinfo)
      ]) : '',
    E('uptime', { style: css.flex }, [
      E('img', { style: css.icon, src: L.resource('icons/clock.webp') }),
      E('span', { style: css.text }, datestr),
      E('span', { style: css.uptime }, '%t'.format(uptime))
    ])
  ]);

  return box;
}

return baseclass.extend({
  title: '',

  load: function () {
    return Promise.all([
      L.resolveDefault(callSystemBoard(), {}),
      L.resolveDefault(callSystemInfo(), {}),
      L.resolveDefault(callCPUUsage(), {}),
      L.resolveDefault(callTempInfo(), {})
    ]);
  },

  render: function (data) {
    const title = data[0].model.replace(/ \(.+/, '');
    return E('div', { style: 'margin: 5px 0;' }, [
      renderTitle(title),
      renderRealTimeInfo(data)
    ]);
  }
});
