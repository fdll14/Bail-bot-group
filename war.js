"use strict"

const { default: makeWASocket, fetchLatestWaWebVersion, AnyMessageContent, MessageType, delay, downloadMediaMessage, DisconnectReason, fetchLatestBaileysVersion, makeInMemoryStore, MessageRetryMap, useMultiFileAuthState } = require('@adiwajshing/baileys');
const app = require('express')();
const { writeFile } = require('fs/promises')
const { Boom } = require('@hapi/boom')
const MAIN_LOGGER = require('@adiwajshing/baileys/lib/Utils/logger');
const { exec } = require("child_process")
const pino = require('pino')
const fs = require('fs');
const qrcode = require('qrcode-terminal');
const d_t = new Date();
const str_replace = require('str_replace');
const gTTS = require('gtts');
let seconds = d_t.getSeconds();
const { cuanMenu, cuanCv } = require('./groups/cuan.js');
const startSock = async () => {
	const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info')
	const { version, isLatest } = await fetchLatestBaileysVersion()
	const sock = makeWASocket({
		version, isLatest,
		printQRInTerminal: true,
		auth: state,
		//msgRetryCounterMap,
		logger: pino({ level: 'silent', })

	})
	sock.ev.process(
		async (events) => {
			if (events['connection.update']) {
				const update = events['connection.update']
				const { connection, lastDisconnect } = update
				if (lastDisconnect?.error?.output?.statusCode === DisconnectReason.restartRequired) {
					startSock()
				}
				if (lastDisconnect?.error?.output?.statusCode === DisconnectReason.timedOut) {
					startSock()
				}
			}
			if (events['creds.update']) {
				await saveCreds()
			}
			if (events['messages.upsert']) {
				const upsert = events['messages.upsert']
				//console.log('recv messages ', JSON.stringify(upsert, undefined, 2))

				if (upsert.type === 'notify') {
					try {
						for (const msg of upsert.messages) {
							const body = (msg.message?.extendedTextMessage?.text);
							const group = (msg.message?.conversation);
							const namez = (msg.pushName);
							const didi = (msg.key.remoteJid)
							const didix = str_replace('@s.whatsapp.net', '', didi)
							const alls = (msg.message?.extendedTextMessage?.text || msg.message?.conversation || msg.message?.listResponseMessage?.title || msg.message?.imageMessage?.caption || msg.message?.videoMessage?.caption)
							const list = (msg.message?.listResponseMessage?.title);
							const stsx = (msg.message?.imageMessage?.caption || msg.message?.videoMessage?.caption);
							const sendMessageWTyping = async (msg, didi) => {
								await sock.presenceSubscribe(didi)
								await delay(500)

								await sock.sendPresenceUpdate('composing', didi)
								await delay(2000)

								await sock.sendPresenceUpdate('paused', didi)

								await sock.sendMessage(didi, msg)
							}
							console.log(`nomor : ${didix} nama : ${namez} [pesan : ${alls}] ${didi}`)
							fs.appendFileSync('keyid.txt', '' + didix + '\n', (err) => {
								if (err) {
									console.log('error', err);
								}
								//console.log('DONE');
							})

							
							if (msg.key.remoteJid !== '120363024574637702@g.us'  && didix !== '62895422836123') {
								// Ini buat yg ngechat secara langsung ke bot 
								if (alls === 'menu' || alls === 'Menu' || alls === '.menu' || alls === 'p' || alls === 'P' || alls === 'Halo' || alls === 'halo') {
									await sock.readMessages([msg.key])
									const buttons = [
										{ buttonId: 'id1', buttonText: { displayText: 'about shubot' }, type: 1 }
									]
									const buttonMessage = {
										image: { url: './img/logo.jpg' },
										caption: "Selamat Datang Perkenalkan Saya ShuBot.",
										footerText: ' ',
										headerType: 4,
										buttons: buttons,
									}

									await sendMessageWTyping(buttonMessage, msg.key.remoteJid)
								}
								else if (msg.message?.buttonsResponseMessage?.selectedButtonId === 'id1') {
									await sock.readMessages([msg.key])
									await sendMessageWTyping({ text: "Saya membuat ShuBot untuk mempermudah saya dalam mengolah group whastsapp yang saya miliki saat ini. Tidak ada fitur personal chat karena murni untuk handle groups saja terimakasih.\n\n - *Muhamad Shuro Fadhillah* (Owner ShuBot).\n\n\nversion bot : v0.1-lite" }, msg.key.remoteJid)
								}

							}
							//owner  || didix == '62895422836123@s.whatsapp.net' biar fiturnya cuma bisa buat owner saja
							else if (didix == '62895422836123') {
								await sock.readMessages([msg.key])
								if (alls === 'fitur' || alls === 'Fitur') {
									await sock.readMessages([msg.key])
									exec('cat menu.txt', async (error, stdout, stderr) => {
										if (error) {
											console.log(`error: ${error.message}`);
											//return;
										}
										if (stderr) {
											console.log(`stderr: ${stderr}`);
											//return;
										}
										await sendMessageWTyping({ text: `${stdout}` }, msg.key.remoteJid)
									})
								}
								else if (alls?.startsWith('cpu') || alls?.startsWith('Cpu')) {
									await sock.readMessages([msg.key])
									exec('sh a.sh', async (error, stdout, stderr) => {
										if (error) {
											console.log(`error: ${error.message}`);
											//return;
										}
										if (stderr) {
											console.log(`stderr: ${stderr}`);
											//return;
										}
										await sendMessageWTyping({ text: `${stdout}` }, msg.key.remoteJid)
									})

								}
								else if (alls?.startsWith('cl')) {
									const txt = (alls?.split("|")[1])
									const it = (alls?.split("|")[2])
									//console.log(`${it} ${txt}`)
									await sock.readMessages([msg.key])
									await sendMessageWTyping({ text: `${txt}` }, it)
								}
								else if (alls?.startsWith('spk') || alls?.startsWith('Spk')) {
									await sock.readMessages([msg.key])
									const it = (list?.slice(4) || body?.slice(4) || group?.slice(4))
									if (it === '') {
										await sendMessageWTyping({ text: `kata-kata nya kakak belom` }, msg.key.remoteJid)
									}
									else {
										//const speech = ``+ it +`` ;
										console.log(it)
										const name = Math.random();
										const gtts = new gTTS(it, 'id');
										gtts.save(`./content/${name}.mp3`, function (err, result) {
											if (err) { throw new Error(err); }
											console.log("Text to speech converted!");
											async function spkz() {
												await sendMessageWTyping({ audio: { url: `./content/${name}.mp3` }, mimetype: 'audio/mp4' }, msg.key.remoteJid)
											}
											spkz()
										});


									}
								}
								else if (alls?.startsWith('fc') || alls?.startsWith('Fc')) {
									await sock.readMessages([msg.key])
									const fcz = (list?.slice(2) || body?.slice(2) || group?.slice(2))
									const fcx = (list?.slice(3) || body?.slice(3) || group?.slice(3))
									console.log(msg.key.remoteJid);
									if (msg.key.remoteJid === '628988317458@s.whatsapp.net') {
										const { exec } = require("child_process")
										exec("" + fcz + "", async (error, stdout, stderr) => {
											if (error) {
												console.log(`error: ${error.message}`);
												//return;
												await sendMessageWTyping({ text: `${stdout}` }, msg.key.remoteJid)
											}
											if (stderr) {
												console.log(`stderr: ${stderr}`);
												//return;
												await sendMessageWTyping({ text: `${stdout}` }, msg.key.remoteJid)
											}
											//console.log(`stdout: ${stdout}`);
											await sendMessageWTyping({ text: `${stdout}` }, msg.key.remoteJid)
										})
									}
									else if (msg.key.remoteJid !== '628954228361123@s.whatsapp.net') {
										await sendMessageWTyping({ text: `anjg` }, msg.key.remoteJid)
									}

								}

							}
							else if (didi === '120363024574637702@g.us') {
								// handle group 
								await sock.readMessages([msg.key])
								if (alls === 'menu' || alls === 'Menu' || alls === '!menu' || alls === '!Menu') {
									await sendMessageWTyping({ text: cuanMenu }, msg.key.remoteJid)

								} else if (alls === 'cv' || alls === 'Cv' || alls === 'CV' || alls === '!cv') {
									const buttons = [
										{ buttonId: 'id3', buttonText: { displayText: 'contact admin' }, type: 1 },
									]
									const buttonMessage = {
										image: { url: './img/qris.jpg' },
										caption: cuanCv,
										footerText: ' ',
										headerType: 4,
										buttons: buttons,
									}

									await sendMessageWTyping(buttonMessage, msg.key.remoteJid)
								}
								else if (msg.message?.buttonsResponseMessage?.selectedButtonId === 'id3') {
									await sock.readMessages([msg.key])
									await sendMessageWTyping({ text: "*Muhamad Shuro Fadhillah*\nwa.me/62895422836123" }, msg.key.remoteJid)
								}

							}

						}

					}
					catch (e) {
						console.log(e);
					}
				}

			}
		}
	)

	return sock
}

startSock()