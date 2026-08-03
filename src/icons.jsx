import React from 'react'
const glyphs={MapPinned:'⌖',Route:'↝',Camera:'●',Users:'♟',LockKeyhole:'◆',Mic:'♪',MessageCircle:'◌',Plus:'＋',Trash2:'×',Check:'✓',ChevronDown:'⌄',Plane:'✈',MapPin:'●',ShieldCheck:'✓',Wifi:'⌁',ImageIcon:'▣'}
const make=name=>({size=20,className='',...props})=><span aria-hidden="true" className={`ico ${className}`} style={{fontSize:size}} {...props}>{glyphs[name]}</span>
export const MapPinned=make('MapPinned'),Route=make('Route'),Camera=make('Camera'),Users=make('Users'),LockKeyhole=make('LockKeyhole'),Mic=make('Mic'),MessageCircle=make('MessageCircle'),Plus=make('Plus'),Trash2=make('Trash2'),Check=make('Check'),ChevronDown=make('ChevronDown'),Plane=make('Plane'),MapPin=make('MapPin'),ShieldCheck=make('ShieldCheck'),Wifi=make('Wifi'),ImageIcon=make('ImageIcon')
