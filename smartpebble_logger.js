const awsMQTT = require('aws-iot-device-sdk');
const fs = require('fs');
const moment = require('moment');
const filepath = "devicelog.csv"
const mqt = awsMQTT.device({
    clientId: "smartpebble-user-04",
    host: 'a5xayppwd3umx-ats.iot.us-east-1.amazonaws.com',
    port: 8883,
    keyPath: './cred/private.pem.key',
    certPath:'./cred/certificate.pem.crt',
    caPath: './cred/AmazonRootCA1.pem',
});

mqt.on('connect', ()  => {
    console.log('connected')
    mqt.subscribe("pebble/data")
})



mqt.on('message',function(topic,message)
{    
    try {
    
    const rawMessage = message.toString();
    fs.appendFileSync('raw_data.log', rawMessage + '\n');

    const messageData = JSON.parse(message.toString());
    const metadata = messageData.WirelessMetadata.LoRaWAN;
    const payloadData = messageData.PayloadData;
    const payloadDataHex = Buffer.from(messageData.PayloadData, 'base64').toString('hex');
    const timestampUTC = messageData.WirelessMetadata.LoRaWAN.Timestamp;
    const timestampIST = moment(timestampUTC).utcOffset('+05:30').format('YYYY-MM-DDTHH:mm:ss');
    // Extract the desired fields
    const fields = [
        timestampIST,
        metadata.ADR,
        metadata.Bandwidth,
        metadata.CodeRate,
        metadata.DataRate,
        metadata.DevAddr,
        metadata.DevEui,
        metadata.FCnt,
        metadata.FOptLen,
        metadata.FPort,

        metadata.Frequency,
        metadata.SpreadingFactor,
        messageData.WirelessMetadata.LoRaWAN.Gateways[0].GatewayEui,
        messageData.WirelessMetadata.LoRaWAN.Gateways[0].Rssi,
        messageData.WirelessMetadata.LoRaWAN.Gateways[0].Snr,
        payloadDataHex
    ];

    
    // Convert the fields to a CSV row
    const csvRow = fields.join(',');

    // Define the header row
    const headerRow = 'Timestamp IST,ADR,Bandwidth,CodeRate,DataRate,DevAddr,DevEui,FCnt,FOptLen,FPort,Frequency,SpreadingFactor, GatewayEUI, Rssi,Snr,PayloadData';

    // Check if the file already exists
    const fileExists = fs.existsSync(filepath);

  
    // If the file doesn't exist, write the header row first
    if (!fileExists) {
        fs.writeFileSync(filepath, headerRow + '\n');
    }
    console.log("recived packet " + timestampIST) ;

    if(payloadDataHex == "00")
    {
        console.log(">>>ACK");
    }


    // Append the CSV row to the file
    fs.appendFileSync(filepath, csvRow + '\n');
    }catch (error) {
        console.error('An error ocscurred:', error);
    }
})




