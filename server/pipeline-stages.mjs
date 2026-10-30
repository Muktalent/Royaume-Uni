// pipeline-colours-v1 · One colour code for the admin sheet, the partner page and the Excel export.
export const STAGE_META={
 'Assessment':{status:'New',tone:'blue',step:1,fill:'FFDCE8F7',font:'FF1F4E80'},
 'Documents pending':{status:'In progress',tone:'amber',step:2,fill:'FFFCEBC6',font:'FF7A5410'},
 'Application preparation':{status:'In progress',tone:'amber',step:3,fill:'FFFCEBC6',font:'FF7A5410'},
 'Application submitted':{status:'Submitted',tone:'violet',step:4,fill:'FFE7E0F7',font:'FF4B3A86'},
 'Offer received':{status:'Ready',tone:'green',step:5,fill:'FFD8F0DF',font:'FF1E6B3A'},
 'Deposit pending':{status:'Action needed',tone:'orange',step:6,fill:'FFFBDCC8',font:'FF8A3F12'},
 'Enrolled':{status:'Completed',tone:'teal',step:7,fill:'FFCDEDEA',font:'FF115E57'},
 'On hold':{status:'On hold',tone:'grey',step:0,fill:'FFE6E4DF',font:'FF55524B'},
 'Closed':{status:'Closed',tone:'red',step:0,fill:'FFF5D9D6',font:'FF8A2A22'}
};
export const STATUS_LEGEND=[['New','Assessment of the profile has started.'],['In progress','Documents or application are being prepared.'],['Submitted','Application sent to the institution.'],['Ready','Offer received: ready for the student decision.'],['Action needed','Deposit or a time-sensitive step is pending.'],['Completed','Student enrolled.'],['On hold','Paused by the student or institution.'],['Closed','No longer progressing.']];
export const stageMeta=stage=>STAGE_META[stage]||{status:'—',tone:'grey',step:0,fill:'FFF2F3EE',font:'FF202A29'};
