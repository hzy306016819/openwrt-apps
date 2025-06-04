local m = Map("ssid-auto", translate("WiFi Auto Switch Settings"),
    translate([[Hybrid solution using iw with iwinfo fallback. 
    Current active tool: ]] .. (os.execute("which iw >/dev/null") == 0 and "iw" or "iwinfo")))

local s = m:section(NamedSection, "global", "settings")

-- 主开关
o = s:option(Flag, "enabled", translate("Enable Auto Switch"))
o.rmempty = false

-- 5G弱信号阈值
o = s:option(Value, "weak_5g", translate("5G Weak Signal Threshold (dBm)"),
    translate("Switch to 2.4G when signal weaker than this value"))
o.datatype = "integer"
o.default = -70
o:depends("enabled", "1")

-- 2.4G强信号阈值
o = s:option(Value, "strong_2g", translate("2.4G Strong Signal Threshold (dBm)"),
    translate("Switch to 5G when signal stronger than this value"))
o.datatype = "integer"
o.default = -60
o:depends("enabled", "1")

-- 弱信号剔除开关
o = s:option(Flag, "enable_kick", translate("Enable 2.4G Weak Signal Kick"))
o.rmempty = false
o:depends("enabled", "1")

-- 2.4G弱信号阈值
o = s:option(Value, "weak_2g", translate("2.4G Weak Signal Kick Threshold (dBm)"))
o.datatype = "integer"
o.default = -75
o:depends("enable_kick", "1")

-- 检查间隔
o = s:option(Value, "interval", translate("Check Interval (seconds)"))
o.datatype = "uinteger"
o.default = 30
o:depends("enabled", "1")

-- MAC白名单
o = s:option(DynamicList, "whitelist", translate("MAC Whitelist"),
    translate("MAC addresses that will not be switched (e.g. 00:11:22:33:44:55)"))
o.datatype = "macaddr"
o.placeholder = "00:11:22:33:44:55"

-- 显示当前驱动信息
local driver_info = luci.sys.exec("iw dev 2>/dev/null | grep Interface | awk '{print $2}' | xargs -I {} readlink /sys/class/net/{}/device/driver | xargs basename 2>/dev/null")
if driver_info ~= "" then
    s:option(DummyValue, "_driver", translate("Detected Driver")).value = driver_info
end

return m
