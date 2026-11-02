'use strict';
// Coordinates correspond to the printed answer regions in the 699 x 1048 PDF page scans.
// No detached answer fields: every control overlays an existing printed box or blank.
const PBQ_BOXES={
 A1:[[310,197,58,18],[310,219,58,36],[310,265,58,18],[310,287,58,36],[310,342,58,18],[310,364,58,36],[310,421,58,18],[310,443,58,36],[310,501,58,18],[310,523,58,35],[310,571,58,18],[310,593,58,36]],
 A2:Array.from({length:8},(_,i)=>[202,88+i*18,141,16]),
 A3:Array.from({length:7},(_,i)=>[154,421+i*28,72,19]),
 A4:[[126,57,35,34],[229,57,37,34],[346,57,35,34],[138,604,36,33],[219,604,37,33],[302,604,37,33]],
 A5:[91,132,174,216,258,300,342].map(y=>[85,y,23,22]),
 B1:[157,188,219,250,281,312].map(y=>[52,y,28,24]),
 B2:[[151,64,133,26],[151,95,261,26],[151,134,133,26],[151,164,261,26],[151,204,133,26],[151,234,261,26],[151,274,133,26],[151,304,261,26],[151,344,133,26],[151,374,261,26],[151,414,133,26],[151,444,261,26]],
 B3:[167,209,250,292,334].map(y=>[85,y,82,23]),
 B4:[[183,56,81,23],[183,199,81,23],[183,344,81,23],[183,497,81,23]],
 B5:[198,225,253,281,310,339,366].map(y=>[82,y,72,20]),
 C1:[248,288,328,368,409,448,488,528].map(y=>[88,y,78,22]),
 C2:[121,191,262,332,402,472].map(y=>[96,y,150,26]),
 C3:[269,307,345,383,421,459].map(y=>[48,y,23,20]),
 C4:[65,107,148,190,231].map(y=>[127,y,198,35]),
 C5:[433,472,510,548,585,624].map(y=>[38,y,37,22])
};
// Two printed PBQs share some source pages. Clip the viewport to the numbered
// activity without shifting its absolute answer coordinates.
const PBQ_SECTION_WINDOWS={
 A2:[0,260],A3:[260,670],
 C4:[0,320],C5:[365,680]
};
// The source's small multiple-choice letter blanks are answered with letters,
// while the larger boxes accept their full option text.
const PBQ_LETTER_BANK={
 A4:['CPU','Memory slots','Main Power','PCI Express slot','SATA interfaces','Headers'],
 A5:['Replace the display','Disable time-of-day color shifting','Monitor input is incorrect','Replace the video data cable','Increase the scaling percentage','Clean dust from the air filters','Non-native resolution is configured'],
 B1:['Update the printer driver configuration','Replace the fuser assembly','Restart the print spooler','Print a test page from the printer console','Clean the pickup rollers','Replace the toner cartridge','Clean the print heads','Change the page description language'],
 C3:['A','B','C','D','E','F']
};
// A1 already prints its full answer bank. Make those printed labels draggable
// instead of creating another bank on top or beside the document.
const PBQ_SOURCE_CHOICES={
 A1:{
  'HDMI':[48,119,59,18],'DB-9':[110,119,59,18],
  'Lightning':[171,119,59,18],'USB-C':[234,119,59,18],
  'RJ45':[298,119,59,18],'SC':[361,119,61,18],
  'Use an external SSD':[48,155,60,36],
  'Charge an older iPad':[110,155,60,36],
  'Run fiber to a building':[171,155,61,36],
  'Connect to a monitor':[235,155,60,36],
  'Use a console interface':[298,155,60,36],
  'Connect to wired Ethernet':[361,155,61,36]
 },
 A3:{'tcp/389':[65,317,72,19],'tcp/80':[148,317,72,19],'tcp/110':[231,317,72,19],'tcp/3389':[314,317,72,19],
 'tcp/25':[65,346,72,19],'tcp/445':[148,346,72,19],'udp/67':[231,346,72,19],'tcp/143':[314,346,72,19],
 'tcp/22':[65,375,72,19],'tcp/23':[148,375,72,19],'udp/53':[231,375,72,19],'tcp/443':[314,375,72,19]},
 A5:Object.fromEntries(['Replace the display','Disable time-of-day color shifting','Monitor input is incorrect','Replace the video data cable','Increase the scaling percentage','Clean dust from the air filters','Non-native resolution is configured'].map((c,i)=>[c,[119,393+i*32,24,21]])),
 B1:Object.fromEntries(['Update the printer driver configuration','Replace the fuser assembly','Restart the print spooler','Print a test page from the printer console','Clean the pickup rollers','Replace the toner cartridge','Clean the print heads','Change the page description language'].map((c,i)=>[c,[110,370+i*31,27,21]])),
 B2:{'Molex':[39,506,44,25],'HDMI':[94,506,47,25],'SATA':[159,506,47,25],
 'DB-9':[226,506,47,25],'RJ11':[286,506,52,25],'F connector':[348,506,67,25],
 'Connect an SSD':[47,565,98,22],'Replace a DSL modem':[158,565,105,22],
 'Connect to a switch console':[275,565,140,22],
 'Install a cable modem':[47,593,100,22],'Add power for internal fans':[158,593,105,22],
 'Replace an external monitor':[275,593,140,22]},
 B3:{'Crimper':[48,72,83,22],'Cable stripper':[141,72,83,22],'Toner probe':[232,72,80,22],'Punchdown tool':[322,72,101,22],
 'Cable tester':[94,111,81,22],'Loopback plug':[183,111,88,22],'Network tap':[279,111,83,22]},
 B5:Object.fromEntries(['SMB','SSH','LDAP','IMAP','Telnet','SMTP','HTTPS','POP3','RDP','DHCP','DNS','FTP'].map((c,i)=>[c,[48+(i%4)*92,90+Math.floor(i/4)*29,83,19]])),
 C1:Object.fromEntries(['ONT','Patch panel','Access point','Firewall','Router','Switch','Cable modem','PoE injector'].map((c,i)=>[c,[65+(i%4)*89,146+Math.floor(i/4)*35,78,20]])),
 C2:{'CPU cooling fan is not running':[82,527,141,24],'Hard drive is failing':[230,527,140,24],
 'Motherboard battery depleted':[82,558,141,24],'OS not installed on boot drive':[230,558,140,24],
 'Faulty RAM':[82,587,141,24],'Damaged Ethernet cable':[230,587,140,24],
 'Power supply failure':[82,617,141,24],'Capacitor has failed':[230,617,140,24]},
 C3:{'A':[94,56,23,21],'B':[224,56,23,21],'C':[354,56,23,21],
 'D':[94,163,23,21],'E':[224,163,23,21],'F':[354,163,23,21]}
};
function pbqLetter(q,value){const a=PBQ_LETTER_BANK[q.id];return a?String.fromCharCode(65+a.indexOf(value)):value}
function pbqShort(q,value,box){if(!value)return '';if(PBQ_LETTER_BANK[q.id])return pbqLetter(q,value);return value.length>Math.max(5,Math.floor(box[2]/7))?value.slice(0,Math.max(4,Math.floor(box[2]/7)-1))+'…':value}
