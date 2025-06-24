# 这是自由软件，遵循Apache 2.0许可证
#
# 版权所有 (C) 2025 wsk170 <wsk170@gmail.com>

include $(TOPDIR)/rules.mk

# 包信息
LUCI_TITLE:=Overview Widgets for LuCI  # 插件标题
LUCI_DEPENDS:=+luci-base  # 依赖项

# 许可证信息
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=wsk170 <wsk170@gmail.com>
PKG_VERSION:=1.0.1
PKG_RELEASE:=1

include $(TOPDIR)/feeds/luci/luci.mk  # 包含LuCI构建系统
