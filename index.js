const HIGHUSEJOBS = [0,1,4,8] // WARR LANC SORC REAPER, ADD YOUR CLASS JOB # IF YOU WANT THE HIGHER THRESHOLD TO TRIGGER

module.exports = function Manapotter(dispatch) {

	let cid = null,
		player = '',
		cooldown = false,
		enabled = true,
		battleground,
		onmount,
		incontract,
		inbattleground,
		alive,
		inCombat,
		job,
		highUse = false,
		ratio = 0.5

	// #############
	// ### Magic ###
	// #############

	dispatch.hook('S_LOGIN', 1, event => {
		({cid, model} = event)
		player = event.name
		job = (model - 10101) % 100;
		if (HIGHUSEJOBS.includes(job)) {
			highUse = true;
		} else {
			highUse = false;
		}
		enabled = true
	})

	dispatch.hook('S_START_COOLTIME_ITEM', 1, event => {
		let item = event.item
		let thiscooldown = event.cooldown

		if(item == 6562) { // has 10 seconds cooldown
			cooldown = true
			setTimeout(() => {
				cooldown = false
			}, thiscooldown*1000)
		}
	})

	dispatch.hook('S_PLAYER_CHANGE_MP', 1, event => {
		currentMp = event.currentMp
		maxMp = event.maxMp

		if(!cooldown && event.target.equals(cid)) {

			if (highUse) {
				if (currentMp <= maxMp - 1000) {
					useItem()
				}
			} else {
				if (currentMp <= maxMp*ratio) {
					useItem()
				}
			}

			useItem()
		}

		if (highUse) {

			if(!cooldown && event.target.equals(cid) && (currentMp <= maxMp - 1000)) {
				useItem()
			}

		} else {

			if(!cooldown && event.target.equals(cid) && (currentMp <= maxMp*ratio)) {
				useItem()
			}

		}

	})

	function useItem() {
		if (!enabled) return
		if(alive && inCombat && !onmount && !incontract && !inbattleground) {
			dispatch.toServer('C_USE_ITEM', 1, {
				ownerId: cid,
				item: 6562, // 6562: Prime Replenishment Potable, 184659: Everful Nostrum
				id: 0,
				unk1: 0,
				unk2: 0,
				unk3: 0,
				unk4: 1,
				unk5: 0,
				unk6: 0,
				unk7: 0,
				x: 0,
				y: 0,
				z: 0,
				w: 0,
				unk8: 0,
				unk9: 0,
				unk10: 0,
				unk11: 1,
			})
		}
	}

	// ##############
	// ### Checks ###
	// ##############

	dispatch.hook('S_BATTLE_FIELD_ENTRANCE_INFO', 1, event => { battleground = event.zone })
	dispatch.hook('S_LOAD_TOPO', 1, event => {
		onmount = false
		incontract = false
		inbattleground = event.zone == battleground
	})

	dispatch.hook('S_SPAWN_ME', 1, event => {
		alive = event.alive
	})

	dispatch.hook('S_USER_STATUS', 1, event => {
		if(event.target.equals(cid)) {
			if(event.status == 1) {
				inCombat = true
			}
			else inCombat = false
		}
	})

	dispatch.hook('S_CREATURE_LIFE', 1, event => {
		if(event.target.equals(cid) && (alive != event.alive)) {
			if(!alive) {
				onmount = false
				incontract = false
			}
		}
	})

	dispatch.hook('S_MOUNT_VEHICLE', 1, event => { if(event.target.equals(cid)) onmount = true })
	dispatch.hook('S_UNMOUNT_VEHICLE', 1, event => { if(event.target.equals(cid)) onmount = false })

	dispatch.hook('S_REQUEST_CONTRACT', 1, event => { incontract = true })
	dispatch.hook('S_ACCEPT_CONTRACT', 1, event => { incontract = false })
	dispatch.hook('S_REJECT_CONTRACT', 1, event => { incontract = false })
	dispatch.hook('S_CANCEL_CONTRACT', 1, event => { incontract = false })

	// #################
	// ### Chat Hook ###
	// #################

	dispatch.hook('C_WHISPER', 1, (event) => {
		if(event.target.toUpperCase() === "!manapotter".toUpperCase()) {
			if (/^<FONT>on?<\/FONT>$/i.test(event.message)) {
				enabled = true
				message('Manapotter <font color="#56B4E9">enabled</font>.')
			}
			else if (/^<FONT>off?<\/FONT>$/i.test(event.message)) {
				enabled = false
				message('Manapotter <font color="#E69F00">disabled</font>.')
			}
			else message('Commands:<br>'
								+ ' "on" (enable Manapotter),<br>'
								+ ' "off" (disable Manapotter)'
						)
			return false
		}
	})

	function message(msg) {
		dispatch.toClient('S_WHISPER', 1, {
			player: cid,
			unk1: 0,
			gm: 0,
			unk2: 0,
			author: '!Manapotter',
			recipient: player,
			message: msg
		})
	}

	dispatch.hook('C_CHAT', 1, event => {
		if(/^<FONT>!mpots<\/FONT>$/i.test(event.message)) {
			if(!enabled) {
				enabled = true
				message('Manapotter <font color="#56B4E9">enabled</font>.')
				console.log('Manapotter enabled.')
			}
			else {
				enabled = false
				message('Manapotter <font color="#E69F00">disabled</font>.')
				console.log('Manapotter disabled.')
			}
			return false
		}
	})
}
