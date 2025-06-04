include $(TOPDIR)/rules.mk

PKG_NAME:=ssid-auto
PKG_VERSION:=1.1  # 版本升级
PKG_RELEASE:=1

PKG_MAINTAINER:=Your Name <your@email.com>
PKG_LICENSE:=GPL-3.0

# 动态依赖：Broadcom平台使用iwinfo，其他默认用iw
DEPENDS:=+lua +luci +luci-compat +luci-lib-json \
         +iw @(!TARGET_bcm53xx&&!TARGET_bcm27xx) \
         +iwinfo @(TARGET_bcm53xx||TARGET_bcm27xx)

include $(INCLUDE_DIR)/package.mk

define Package/ssid-auto
  SECTION:=net
  CATEGORY:=Network
  SUBMENU:=Wireless
  TITLE:=Auto WiFi Switch (iw/iwinfo compatible)
  URL:=https://github.com/hzy306016819/ssid-auto
  PKGARCH:=all
endef

define Package/ssid-auto/description
  Hybrid solution using iw with iwinfo fallback for broadcom compatibility.
endef

define Build/Configure
endef

define Build/Compile
endef

define Package/ssid-auto/install
    # 安装配置文件
    $(INSTALL_DIR) $(1)/etc/config
    $(INSTALL_CONF) ./files/etc/config/ssid-auto $(1)/etc/config/
    
    # 安装热插拔脚本
    $(INSTALL_DIR) $(1)/etc/hotplug.d/iface
    $(INSTALL_BIN) ./files/etc/hotplug.d/iface/99-ssid-auto $(1)/etc/hotplug.d/iface/
    
    # 安装init脚本
    $(INSTALL_DIR) $(1)/etc/init.d
    $(INSTALL_BIN) ./files/etc/init.d/ssid-auto $(1)/etc/init.d/
    
    # 安装LuCI组件
    $(INSTALL_DIR) $(1)/usr/lib/lua/luci/controller
    $(INSTALL_DATA) ./files/usr/lib/lua/luci/controller/ssid-auto.lua $(1)/usr/lib/lua/luci/controller/
    
    $(INSTALL_DIR) $(1)/usr/lib/lua/luci/model/cbi/ssid-auto
    $(INSTALL_DATA) ./files/usr/lib/lua/luci/model/cbi/ssid-auto/settings.lua $(1)/usr/lib/lua/luci/model/cbi/ssid-auto/
    
    # 安装主程序
    $(INSTALL_DIR) $(1)/usr/bin
    $(INSTALL_BIN) ./src/ssid-auto.sh $(1)/usr/bin/ssid-auto
endef

$(eval $(call BuildPackage,ssid-auto))
