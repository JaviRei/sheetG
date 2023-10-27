const { GoogleSpreadsheet } = require("google-spreadsheet");
const fs = require("fs");
const RESPONSES_SHEET_ID = "11aKH7Vex2R1FS4P33BDdcoxMNUIPXS-FySgrFppVY8w"; //Aquí pondras el ID de tu hoja de Sheets
const doc = new GoogleSpreadsheet(RESPONSES_SHEET_ID);
const CREDENTIALS = JSON.parse(fs.readFileSync("./credenciales.json"));

const {
  createBot,
  createProvider,
  createFlow,
  addKeyword,
  addAnswer,
} = require("@bot-whatsapp/bot");

const QRPortalWeb = require("@bot-whatsapp/portal");
const BaileysProvider = require("@bot-whatsapp/provider/baileys");
const MockAdapter = require("@bot-whatsapp/database/mock");

/*                       Para añadir o eliminar alguna pregunta sigue los siguientes pasos:
1) ➡️ Crea el addAnswer
2) ➡️ Crea la variable del STATUS
3) ➡️ Añade el nombre de la columna de Sheets junto con su variable
                      */

let STATUS = {};

const flowHola = addKeyword("console")
  .addAnswer(
    "Hola! soy un chatbot que está vinculado con Google SpreadSheet, *responde a las siguientes preguntas*:"
  )
  .addAnswer(
    ["Dime tu sexo","Hombre o Mujer"],
    { capture: true/* , buttons: [{ body: "Hombre" }, { body: "Mujer" }]  */},
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

//////////////////////////// FLUJO PARA CONSULTAR DATOS /////////////////////////////////////////////////////////

const flowConsultar = addKeyword(
  "Consultar mis datos",
  "🔍 Consultar mis datos 🔍"
)
  .addAnswer([
    "Dame unos segundo, estoy buscando tus datos dentro del sistema... 🔍",
  ])
  .addAnswer(
    ["Según el teléfono del cuál me estas escribiendo, tengo estos datos:"],
    { delay: 3000 },
    async (ctx, { flowDynamic }) => {
      telefono = ctx.from;

      const consultar = await consultarDatos(telefono);

      const Sexo = consultados["Sexo"]; // AQUI DECLARAMOS LAS VARIABLES CON LOS DATOS QUE NOS TRAEMOS DE LA FUNCION         VVVVVVVVV
      const Nombre = consultados["Nombre"];
      const Apellidos = consultados["Apellidos"];
      const Telefono = consultados["Telefono"];
      const Edad = consultados["Edad"];

      await flowDynamic(
        `- *Sexo*: ${Sexo}\n- *Nombre*: ${Nombre}\n- *Apellidos*: ${Apellidos}\n- *Telefono*: ${Telefono}\n- *Edad*: ${Edad}`
      );
    }
  );

/////////////////////       ESTA FUNCION CONSULTA LOS DATOS DE UNA FILA !SEGÚN EL TELÉFONO!    /////////////////////////

async function consultarDatos(telefono) {
  await doc.useServiceAccountAuth({
    client_email: CREDENTIALS.client_email,
    private_key: CREDENTIALS.private_key,
  });
  await doc.loadInfo();
  let sheet = doc.sheetsByTitle["Hoja 1"]; // AQUÍ DEBES PONER EL NOMBRE DE TU HOJA

  consultados = [];

  let rows = await sheet.getRows();
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    if (row.Telefono === telefono) {
      consultados["Sexo"] = row.Sexo; // AQUÍ LE PEDIMOS A LA FUNCION QUE CONSULTE LOS DATOS QUE QUEREMOS CONSULTAR EJEMPLO:
      consultados["Nombre"] = row.Nombre;
      consultados["Apellidos"] = row.Apellidos; // consultados['EL NOMBRE QUE QUIERAS'] = row.NOMBRE DE LA COLUMNA DE SHEET
      consultados["Telefono"] = row.Telefono;
      consultados["Edad"] = row.Edad;
    }
  }

  return consultados;
}

const main = async () => {
  const adapterDB = new MockAdapter();
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
