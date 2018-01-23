const HIGHUSEJOBS = [0,1,4,8] // WARR LANC SORC REAPER, ADD YOUR CLASS JOB # IF YOU WANT THE HIGHER THRESHOLD TO TRIGGER
const MPCD = 10000; // in ms
const Command = require('command');

module.exports = function Manapotter(dispatch) {

	const command = Command(dispatch);
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
		sorc = false,
		ratio = 0.5,
		curMp = null,
		maxMp = null,
		threshold = 0,
		isSet = false;


	// #############
	// ### Magic ###
	// #############

	dispatch.hook('S_LOGIN', 1, event => {
		({cid, model} = event)
		player = event.name
		job = (model - 10101) % 100;
		if (job == 4) {
			sorc = true;
		} else if (HIGHUSEJOBS.includes(job)) {
			highUse = true;
			sorc = false;
		} else {
			highUse = false;
			sorc = false;
		}
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
				checkMp();
			}, MPCD)
		}
	})

	dispatch.hook('S_PLAYER_CHANGE_MP', 1, event => {

		if (event.target.equals(cid)) {
			curMp = event.curMp;
			maxMp = event.maxMp;
			if (enabled) checkMp();
		}

	})

	function checkMp() {

		if (!isSet) {
			
			threshold = maxMp / 2;
			if (sorc) threshold = maxMp - 1600;
			else if (highUse) threshold = maxMp - 1000;
			else threshold = maxMp * ratio;

			isSet = true;
		}


		if (!cooldown && curMp <= threshold) {
			useItem();
		}

	}

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
		isSet = false;
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

	command.add('mPots', (arg) => {
		switch (arg) {
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
