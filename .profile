if uwsm check may-start; then
	#LIBVA_DRIVER_NAME=nvidia __NV_PRIME_RENDER_OFFLOAD=1 __GLX_VENDOR_LIBRARY_NAME=nvida exec uwsm start hyprland-uwsm.desktop
	exec prime-run uwsm start hyprland-uwsm.desktop
fi
