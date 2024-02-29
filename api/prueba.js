const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  cert: fs.readFileSync(path.resolve(__dirname,'../public/cert-Apolo.crt')),
  key: fs.readFileSync(path.resolve(__dirname,'../public/apolo.key'))
});

const options = {
  headers: {
    'Content-Type': 'application/json',
    Auth1: 'test',
    Auth2: 'test'
  }
};

/**
 * Process transaction payment.
 * @param  {String} [ccnumber] Credit card number to process.
 * @param  {String} [expDate]  Credit card expiry date.
 * @param  {String} [cvc]      Credit card CVC.
 * @param  {Object} [order]    Transaction document, must contain order reference, id, total and ITBIS.
 * @param  {String} [token]    All other params are optional if given a token value.
 * @return {Object}            Azul ProcessPayment webservice response.
 */
export default{
    processPayment : async (req, res) => {
        console.log(req.body)
        const payload = {
            Channel: 'EC',
            Store: '39036630010',
            CardNumber: "",
            Expiration: "",
            CVC: "",
            PosInputMode: 'E-Commerce',
            TrxType: 'Sale',
            Amount: req.body.costo+'00',
            Itbis: '00',
            CurrencyPosCode: '$',
            Payments: '1',
            Plan: '0',
            AcquirerRefData: '1',
            RRN: null,
            CustomerServicePhone: '809-111-2222',
            OrderNumber: '',
            CustomOrderId: 'ABC123',
            ECommerceUrl: 'appolotaxi.com',
            DataVaultToken:'6031893E-5E7B-4ED2-AA7B-069EA0267A1E',
            SaveToDataVault:0
        };

        // Payment with Data Vault token


        try {
            const { data } = await axios.post(
            'https://pruebas.azul.com.do/webservices/JSON/Default.aspx',
            payload,
            options
            );
            res.status(201).send(JSON.stringify(data))
        } catch (error) {
            console.log(error.config)
            console.log(error)
            res.status(201).send(JSON.stringify(error))
        }
    },

    /**
     * Verify a transaction.
     * Checks if a transaction is valid.
     * @param  {String} orderID Given CustomOrderID to transaction to verify.
     * @return {Object}         Azul VerifyPayment webservice response.
     */
    verifyTransaction : async orderID => {
        const payload = {
            Channel: 'EC',
            Store: keys.merchantID,
            CustomOrderId: orderID
        };

        try {
            const { data } = await axios.post(
            `https://pruebas.azul.com.do/webservices/JSON/Default.aspx?verifypayment`,
            payload,
            options
            );

            return Promise.resolve(data);
        } catch (error) {
            return error;
        }
    },

    /**
     * Generates Data Vault token.
     * @param  {String} ccnumber Credit card number to process.
     * @param  {String} expDate  Credit card expiry date.
     * @param  {String} cvc      Credit card CVC.
     * @return {Object}          Azul Create data vault webservice response.
     */
    generateToken : async (ccnumber, expDate, cvc) => {
        const payload = {
            Channel: 'EC',
            Store: '39036630010',
            CardNumber: '6011000990099818',
            Expiration: '202012',
            CVC: '818',
            TrxType: 'CREATE'
        };

        try {
            const { data } = await axios.post(
            `https://pruebas.azul.com.do/webservices/JSON/Default.aspx?ProcessDatavault`,
            payload,
            options
            );
                console.log(data)
            return data;
        } catch (error) {
            console.log(error)
            return Promise.reject(error);
        }
    },

    /**
     * Deletes Data Vault token.
     * @param  {String} token Data Vault token.
     * @return {Object}       Azul Delete data vault webservice response.
     */
    deleteToken : async token => {
        const payload = {
            Channel: 'EC',
            Store: keys.merchantID,
            CardNumber: '',
            Expiration: '',
            CVC: '',
            TrxType: 'DELETE',
            DataVaultToken: token
        };

        try {
            const { data } = await axios.post(
            `https://pruebas.azul.com.do/webservices/JSON/Default.aspx?ProcessDatavault`,
            payload,
            options
            );

            return data;
        } catch (error) {
            return Promise.reject(error);
        }
    }
}
