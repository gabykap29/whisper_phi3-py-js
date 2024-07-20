const url = process.env.URL_IA_JAVASCRIPT || "http://localhost:11434/api/generate";



class ModelTranscriptionController {
  //metodo para generar actividades
  async trancribeAndIdentifiquer(req, res) {
    const { transcription } = req.body;
    const consulta = transcription;

    console.log(req.body);
    try {
      const peticion = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "cm-phi3-text",
          prompt: consulta,
          num_keep: 1,

        }),
      });

      // Establecer encabezados para indicar que se enviará una respuesta progresiva
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Transfer-Encoding", "chunked");

      // Inicializar el JSON acumulado
      let accumulatedJSON = "";

      // Leer la respuesta como texto
      const reader = peticion.body.getReader();
      let decoder = new TextDecoder();
      let chunk = await reader.read();
      while (!chunk.done) {
        const texto = decoder.decode(chunk.value, { stream: true });
        accumulatedJSON += texto;

        // Buscar todas las ocurrencias de respuesta JSON en el texto acumulado
        let startIndex = 0;
        while (startIndex < accumulatedJSON.length) {
          const startBracketIndex = accumulatedJSON.indexOf("{", startIndex);
          if (startBracketIndex === -1) break; // No hay más objetos JSON en el texto acumulado
          const endBracketIndex = accumulatedJSON.indexOf(
            "}",
            startBracketIndex
          );
          if (endBracketIndex === -1) break; // JSON parcial, espera más datos
          const jsonString = accumulatedJSON.slice(
            startBracketIndex,
            endBracketIndex + 1
          );
          try {
            const responseObject = JSON.parse(jsonString);
            const responseValue = responseObject.response;
            res.write(responseValue);
          } catch (error) {
            // Ignorar errores de análisis JSON parcial
          }
          startIndex = endBracketIndex + 1;
        }

        // Eliminar las partes ya procesadas del texto acumulado
        accumulatedJSON = accumulatedJSON.slice(startIndex);

        chunk = await reader.read();
      }

      res.end(); // Finalizar la respuesta
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "error leyendo el json en el servidor!" });
    }

  }

}

export default ModelTranscriptionController;