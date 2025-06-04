#!/bin/sh

. /lib/functions.sh
. /etc/config/ssid-auto

CONFIG=ssid-auto
LOG_TAG="ssid-auto"

# 获取无线接口驱动类型
get_wireless_driver() {
    local iface=$1
    basename $(readlink /sys/class/net/$iface/device/driver) 2>/dev/null || echo "unknown"
}

# 混合模式获取RSSI
get_client_rssi() {
    local iface=$1
    local mac=$2
    local driver=$(get_wireless_driver "$iface")
    local rssi=""

    # 根据驱动类型选择工具
    case "$driver" in
        brcmfmac|broadcom*)
            # Broadcom驱动使用iwinfo
            rssi=$(iwinfo "$iface" assoclist 2>/dev/null | \
                  awk -v mac="$mac" 'BEGIN{IGNORECASE=1} $0 ~ mac {print $2}')
            ;;
        *)
            # 其他驱动优先使用iw
            rssi=$(iw dev "$iface" station get "$mac" 2>/dev/null | \
                  awk '/signal avg:/{print $3}')
            
            # 如果iw失败尝试iwinfo
            [ -z "$rssi" ] && {
                rssi=$(iwinfo "$iface" assoclist 2>/dev/null | \
                      awk -v mac="$mac" 'BEGIN{IGNORECASE=1} $0 ~ mac {print $2}')
            }
            ;;
    esac

    echo "$rssi"
}

# 日志记录
log() {
    logger -t "$LOG_TAG" "$1"
    [ "$DEBUG" = "1" ] && echo "$(date) - $1"
}

# 验证MAC地址格式
valid_mac() {
    echo "$1" | grep -qiE '^([0-9A-F]{2}:){5}[0-9A-F]{2}$'
}

# 检查白名单
is_whitelisted() {
    local mac=$1
    uci -q get $CONFIG.global.whitelist | while read entry; do
        if valid_mac "$entry" && [ "$(echo $mac | tr '[:upper:]' '[:lower:]')" = "$(echo $entry | tr '[:upper:]' '[:lower:]')" ]; then
            return 0
        fi
    done
    return 1
}

# 获取无线接口
get_wifi_interfaces() {
    wifi_24g=""
    wifi_5g=""
    
    # 通过uci配置找出2.4G和5G接口
    wifi_devices=$(uci -q show wireless | grep '=wifi-device' | cut -d'=' -f1 | cut -d'.' -f2)
    
    for device in $wifi_devices; do
        hwmode=$(uci -q get wireless.$device.hwmode)
        iface=$(uci -q show wireless | grep -E "=wifi-iface" | grep "device='$device'" | \
                cut -d'=' -f1 | cut -d'.' -f2 | head -n1)
        
        case "$hwmode" in
            11g|11ng)
                wifi_24g="$iface"
                ;;
            11a|11na|11ac)
                wifi_5g="$iface"
                ;;
        esac
    done
    
    [ -z "$wifi_24g" ] && log "WARNING: 2.4G interface not found!"
    [ -z "$wifi_5g" ] && log "WARNING: 5G interface not found!"
}

# 断开客户端连接
disconnect_client() {
    local iface=$1
    local mac=$2
    
    # 尝试hostapd_cli
    if [ -e "/var/run/hostapd-$iface" ]; then
        hostapd_cli -i "$iface" deauthenticate "$mac" && {
            log "Disconnected $mac from $iface (hostapd)"
            return 0
        }
    fi
    
    # 回退到iw命令
    iw dev "$iface" station del "$mac" 2>/dev/null && {
        log "Disconnected $mac from $iface (iw)"
        return 0
    }
    
    log "ERROR: Failed to disconnect $mac from $iface"
    return 1
}

# 主处理循环
process_band() {
    local iface=$1
    local band=$2  # 24g或5g
    
    iw dev "$iface" station dump 2>/dev/null | awk '/Station/{print $2}' | while read mac; do
        is_whitelisted "$mac" && continue
        
        rssi=$(get_client_rssi "$iface" "$mac")
        [ -z "$rssi" ] && continue

        case "$band" in
            5g)
                # 5G弱信号切换逻辑
                if [ "$rssi" -lt "$weak_5g" ]; then
                    log "5G弱信号切换: $mac (RSSI: $rssi < $weak_5g)"
                    disconnect_client "$iface" "$mac"
                fi
                ;;
            24g)
                # 2.4G强信号切换逻辑
                if [ "$rssi" -gt "$strong_2g" ]; then
                    log "2.4G强信号切换: $mac (RSSI: $rssi > $strong_2g)"
                    disconnect_client "$iface" "$mac"
                # 弱信号剔除逻辑
                elif [ "$enable_kick" = "1" ] && [ "$rssi" -lt "$weak_2g" ]; then
                    log "2.4G弱信号剔除: $mac (RSSI: $rssi < $weak_2g)"
                    disconnect_client "$iface" "$mac"
                fi
                ;;
        esac
    done
}

# 主函数
main() {
    # 初始化配置
    local enabled weak_5g strong_2g enable_kick weak_2g interval
    config_load "$CONFIG"
    config_get enabled global enabled 0
    config_get weak_5g global weak_5g -70
    config_get strong_2g global strong_2g -60
    config_get enable_kick global enable_kick 0
    config_get weak_2g global weak_2g -75
    config_get interval global interval 30

    [ "$enabled" != "1" ] && return

    # 获取接口
    get_wifi_interfaces
    [ -z "$wifi_24g" ] || [ -z "$wifi_5g" ] && {
        log "ERROR: Missing WiFi interfaces"
        return 1
    }

    # 主循环
    while true; do
        process_band "$wifi_5g" "5g"
        process_band "$wifi_24g" "24g"
        sleep "$interval"
    done
}

# 启动
main
