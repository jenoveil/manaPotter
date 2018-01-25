const Command = require('command');

module.exports = function Manapotter(dispatch) {

	let cid = null,
		ratio = 0.5,
		player = '',
		cooldown = false,
		enabled = true,
		battleground,
		onmount,
		incontract,
		inbattleground,
		alive,
		inCombat,
		location;

	// #############
	// ### Magic ###
	// #############

	dispatch.hook('S_LOGIN', 1, event => {
		({cid} = event)
		player = event.name
		enabled = true
	})

	dispatch.hook('C_PLAYER_LOCATION', 1, event =>{location = event})

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

		if(!cooldown && event.target.equals(cid) && (currentMp <= maxMp*ratio)) {
			useItem()
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
				x: location.x1,
        y: location.y1,
        z: location.z1,
        w: location.w,
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

	command.add('mpMode', (arg) => {
		switch (arg) {
			case 'sorc':
				ratio = 0.875;
				break;
			case 'high':
				ratio = 0.75;
				break;
			case 'normal':
				ratio = 0.5;
				break;
			// experimental, set your own value
			default:
				ratio = parseFloat(arg);
				break;
		} command.message('MpPotter mode set to ' + arg + '.');
	});

	command.add('mpots', (arg) => {
		switch (arg) {
			// enable/disable
			case 'on':
				enabled = true;
				break;
			case 'off':
				enabled = false;
				break;
			default:
				enabled = !enabled;
				break;
		} command.message('Manapotter ' + (enabled ? 'enabled' : 'disabled') + '.');
	});

}
