include $(TOPDIR)/rules.mk

# 基础包信息
PKG_NAME:=ssid-auto
PKG_VERSION:=1.1
PKG_RELEASE:=$(shell git rev-list --count HEAD 2>/dev/null || echo 1)
PKG_MAINTAINER:=Your Name <your@email.com>
PKG_LICENSE:=GPL-3.0
PKG_LICENSE_FILES:=LICENSE

# 构建配置（关键修改点）
PKG_INSTALL:=1
PKG_BUILD_PARALLEL:=1
PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_NAME)

# 动态检测LuCI路径（兼容性处理）
LUCI_PATH:=$(wildcard $(TOPDIR)/feeds/luci/luci.mk)
ifneq ($(LUCI_PATH),)
  include $(LUCI_PATH)
endif

# 依赖配置
DEPENDS:= \
    +lua \
    +luci-base \
    +luci-compat \
    +luci-lib-json \
    +luci-lib-httpclient \
    +iw @(!TARGET_bcm53xx&&!TARGET_bcm27xx) \
    +iwinfo @(TARGET_bcm53xx||TARGET_bcm27xx) \
    +hostapd-utils

# LuCI应用定义（有条件加载）
ifneq ($(LUCI_PATH),)
  LUCI_TITLE:=WiFi Auto Switch (2.4G/5G)
  LUCI_DEPENDS:=+luci-lib-ip +luci-lib-nixio
  LUCI_PKGARCH:=all
endif

define Package/ssid-auto
  SECTION:=net
  CATEGORY:=Network
  SUBMENU:=Wireless
  TITLE:=Auto WiFi Switch with iw/iwinfo support
  URL:=https://github.com/hzy306016819/ssid-auto
  PKGARCH:=all
  USERID:=ssidauto:ssidauto
endef

define Package/ssid-auto/description
  Intelligent switching between 2.4G (M450M) and 5G (ASUS_5G) networks.
  Features include:
  - Dual-band threshold-based switching
  - MAC whitelist support
  - Hybrid iw/iwinfo backend
  - Real-time status monitoring
endef

define Package/ssid-auto/conffiles
/etc/config/ssid-auto
/usr/bin/ssid-auto
endef

# 构建规则（关键修改点）
define Build/Configure
endef

define Build/Compile
endef

define Build/Install
    # 空规则，因为使用files/目录直接安装
    true
endef

# 文件安装规则（完整列表）
define Package/ssid-auto/install
    # 配置文件
    $(INSTALL_DIR) $(1)/etc/config
    $(INSTALL_CONF) ./files/etc/config/ssid-auto $(1)/etc/config/
    
    # 热插拔脚本
    $(INSTALL_DIR) $(1)/etc/hotplug.d/iface
    $(INSTALL_BIN) ./files/etc/hotplug.d/iface/99-ssid-auto $(1)/etc/hotplug.d/iface/
    
    # Init脚本
    $(INSTALL_DIR) $(1)/etc/init.d
    $(INSTALL_BIN) ./files/etc/init.d/ssid-auto $(1)/etc/init.d/
    
    # LuCI组件
    $(INSTALL_DIR) $(1)/usr/lib/lua/luci/controller
    $(INSTALL_DATA) ./files/usr/lib/lua/luci/controller/ssid-auto.lua $(1)/usr/lib/lua/luci/controller/
    
    $(INSTALL_DIR) $(1)/usr/lib/lua/luci/model/cbi
    $(INSTALL_DATA) ./files/usr/lib/lua/luci/model/cbi/ssid-auto/settings.lua $(1)/usr/lib/lua/luci/model/cbi/
    
    # 主程序
    $(INSTALL_DIR) $(1)/usr/bin
    $(INSTALL_BIN) ./src/ssid-auto.sh $(1)/usr/bin/ssid-auto
    $(SED) 's|#!/bin/sh|#!/bin/sh\n# Managed by OpenWrt package|' $(1)/usr/bin/ssid-auto
    
    # 驱动数据
    $(INSTALL_DIR) $(1)/usr/share/ssid-auto
    $(INSTALL_DATA) ./src/driver-compat.list $(1)/usr/share/ssid-auto/
    
    # 首次启动配置
    $(INSTALL_DIR) $(1)/etc/uci-defaults
    $(INSTALL_BIN) ./files/etc/uci-defaults/40-enable-ssid-auto $(1)/etc/uci-defaults/
endef

# 安装后脚本（注意Tab缩进）
define Package/ssid-auto/postinst
#!/bin/sh
[ -n "$$IPKG_INSTROOT" ] || {
    # 首次启动时启用服务
    /etc/init.d/ssid-auto enable >/dev/null 2>&1
    echo "Configuration: /etc/config/ssid-auto"
    echo "Start command: /etc/init.d/ssid-auto start"
}
exit 0
endef

# 条件构建（兼容无LuCI环境）
ifneq ($(LUCI_PATH),)
  $(eval $(call BuildLuciPackage,ssid-auto))
endif
$(eval $(call BuildPackage,ssid-auto))
