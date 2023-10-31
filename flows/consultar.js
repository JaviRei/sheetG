const {
    createBot,
    createProvider,
    createFlow,
    addKeyword,
    addAnswer,
  } = require("@bot-whatsapp/bot");

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



module.exports = {flowConsultar,consultarDatos}