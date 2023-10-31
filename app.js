const {conexion} = require("./src/mysql")
const {flowConsultar, consultarDatos} = require("./flows/consultar")
const { GoogleSpreadsheet } = require("google-spreadsheet");
const fs = require("fs");
const RESPONSES_SHEET_ID = "11aKH7Vex2R1FS4P33BDdcoxMNUIPXS-FySgrFppVY8w"; //Aquí pondras el ID de tu hoja de Sheets
const doc = new GoogleSpreadsheet(RESPONSES_SHEET_ID);
const CREDENTIALS = JSON.parse(fs.readFileSync("./credenciales.json"));
const MySQLAdapter = require('@bot-whatsapp/database/mysql')

const MYSQL_DB_HOST = 'localhost';
const MYSQL_DB_USER = 'root';
const MYSQL_DB_PASSWORD = '';
const MYSQL_DB_NAME = "practica_db";
const MYSQL_DB_PORT = '3306';

conexion.connect((err) => {
  if(err){
   throw err;
  }
  else{
   console.log('Conexión exitosa')
  }
})

const {
  createBot,
  createProvider,
  createFlow,
  addKeyword,
  addAnswer,
} = require("@bot-whatsapp/bot");

const QRPortalWeb = require("@bot-whatsapp/portal");
const BaileysProvider = require("@bot-whatsapp/provider/baileys");



let STATUS = {};

const flowHola = addKeyword(['hola','ola','alo','buenos'])
  .addAnswer(
    "Hola! soy un chatbot que está vinculado con Google SpreadSheet, y msql *responde a las siguientes preguntas*:"
  )
  .addAnswer(
    ["¿Cúal es tu sexo?: ","Hombre o Mujer"],
    { capture: true},
    async (ctx, { flowDynamic }) => {
      telefono = ctx.from;
      sexo = STATUS[telefono] = { ...STATUS[telefono], sexo: ctx.body }; //➡️ Variable del STATUS
      telefono = STATUS[telefono] = { ...STATUS[telefono], telefono: ctx.from }; // Variable del STATUS
      // Ejemplo // NOMBRE VARIABLE = TATUS[telefono], NOMBRE VARIABLE : ctx.body
      flowDynamic();
    }
  )
  .addAnswer(
    "Dime tu nombre",
    { capture: true },
    async (ctx, { flowDynamic }) => {
      telefono = ctx.from;
      nombre = STATUS[telefono] = { ...STATUS[telefono], nombre: ctx.body };

      flowDynamic();
    }
  )
  .addAnswer(
    "Dime tus apellidos",
    { capture: true },
    async (ctx, { flowDynamic }) => {
      telefono = ctx.from;
      apellidos = STATUS[telefono] = {
        ...STATUS[telefono],
        apellidos: ctx.body,
      }; //Variable del STATUS
      console.log(STATUS[telefono].sexo);
      flowDynamic();
    }
  )
  .addAnswer(
    "¿Qué edad tienes?",
    { capture: true },
    async (ctx, { flowDynamic }) => {
      telefono = ctx.from;
      edad = STATUS[telefono] = { ...STATUS[telefono], edad: ctx.body }; //Variable del STATUS
      
      /////////////////////  FUNCION PARA AGREGAR LOS DATOS A SHEETS /////////////////////////////

      ingresarDatos();
      async function ingresarDatos() {
        console.log(STATUS[telefono].edad);
        
        //DECLARAMOS LAS CABECERAS
        let rows = [
          {
            // Ejemplo: // CABECERA DE SHEET : VARIABLE        //                             ➡️   Paso 3 - Aquí añades las variables creadas

            Sexo: STATUS[telefono].sexo,
            Nombre: STATUS[telefono].nombre,
            Apellidos: STATUS[telefono].apellidos,
            Telefono: STATUS[telefono].telefono,
            Edad: STATUS[telefono].edad,
          },
        ];
        const name = `INSERT INTO users (user_id, user_handle, user_email, first_name, last_name, phone_number, created_at) VALUES (NULL, ${rows.Sexo.values()}, NULL, ${nombre},'NULL','NULL', current_timestamp())`;
      await insert_db(name)

        await doc.useServiceAccountAuth({
          client_email: CREDENTIALS.client_email,
          private_key: CREDENTIALS.private_key,
        });


        await doc.loadInfo();
        let sheet = doc.sheetsByIndex[0];
        for (let index = 0; index < rows.length; index++) {
          const row = rows[index];
          await sheet.addRow(row);
        }
      }

      await flowDynamic([
        {
          body: `Perfecto ${STATUS[telefono].nombre}, espero que te haya parecido sencillo el formulario 😁`,
        },
      ]);
      await flowDynamic({
        body: `Puedes consultar tus datos escribiendo *Consultar mis datos:* `/* ,
        buttons: [{ body: "🔍 Consultar mis datos 🔍" }], */
      });
    }
  );


  const insert_db = async (name)=> {
    conexion.query(name,(error,rows) => {
      if(error){
          throw error;
      }
      else{
          console.log('Datos ingresados');
          console.log(rows)
      }
  });
  }

const main = async () => {
  const adapterDB = new MySQLAdapter({
    host: MYSQL_DB_HOST,
    user: MYSQL_DB_USER,
    database: MYSQL_DB_NAME,
    password: MYSQL_DB_PASSWORD,
    port: MYSQL_DB_PORT,
})
  const adapterFlow = createFlow([flowHola, flowConsultar]);
  const adapterProvider = createProvider(BaileysProvider);

  createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  });

  QRPortalWeb();
};

main();
