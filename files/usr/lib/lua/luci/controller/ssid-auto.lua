-- 定义模块命名空间
module("luci.controller.ssid-auto", package.seeall)

function index()
    -- 检查配置文件是否存在
    if not nixio.fs.access("/etc/config/ssid-auto") then
        return
    end

    -- 添加权限检查
    local page = entry({"admin", "network", "ssid-auto"}, 
        firstchild(), _("WiFi Auto Switch"), 60)
    page.dependent = false
    page.acl_depends = { "luci-app-ssid-auto" }

    -- 主设置页面
    entry({"admin", "network", "ssid-auto", "settings"},
        cbi("ssid-auto/settings"), _("Settings"), 10)
    
    -- 状态页面（显示当前连接状态）
    entry({"admin", "network", "ssid-auto", "status"},
        call("action_status"), _("Status"), 20)
    
    -- 操作接口（用于AJAX调用）
    entry({"admin", "network", "ssid-auto", "toggle"},
        call("action_toggle"), nil, 30).leaf = true
end

-- 获取当前状态（JSON格式）
function action_status()
    local uci = require "luci.model.uci".cursor()
    local sys = require "luci.sys"
    local result = {
        enabled = uci:get("ssid-auto", "global", "enabled") or "0",
        running = sys.process.stat("ssid-auto") ~= nil
    }
    
    luci.http.prepare_content("application/json")
    luci.http.write_json(result)
end

-- 快速切换开关
function action_toggle()
    local uci = require "luci.model.uci".cursor()
    local enabled = uci:get("ssid-auto", "global", "enabled") or "0"
    local newval = enabled == "1" and "0" or "1"
    
    uci:set("ssid-auto", "global", "enabled", newval)
    uci:commit("ssid-auto")
    
    -- 立即启停服务
    if newval == "1" then
        os.execute("/etc/init.d/ssid-auto start >/dev/null 2>&1")
    else
        os.execute("/etc/init.d/ssid-auto stop >/dev/null 2>&1")
    end
    
    luci.http.prepare_content("text/plain")
    luci.http.write(newval)
end
