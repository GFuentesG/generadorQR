import Text "mo:base/Text";
import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Types "./types";
import Map "mo:map/Map";
import { thash } "mo:map/Map";
import Time "mo:base/Time";
import Generacion "./generacion";
import Array "mo:base/Array";
import Iter "mo:core/Iter"

persistent actor {

    stable var registros = Map.new<Text, Types.Registro>();

    //prueba
    public query func leerCodigoGs1(codigo : Text) : async Text {

        return "Dato ingresado: " # codigo;
    };

    //guardar codigo
    public shared (msg) func addRegistro(codigo : Text) : async Types.GetRegistroResult {
        //if (Principal.isAnonymous(msg.caller)) return #err(#userNotAuthenticated);

        // Verificar si ya existe
        if (Map.has(registros, thash, codigo)) {
            return #err(#registroAlreadyExists);
        };

        let nuevoRegistro : Types.Registro = {
            codigoGs1 = codigo;
            owner = msg.caller;
            fechaCreacion = Time.now();
        };

        Debug.print("Registro guardado: " # codigo);
        Map.set(registros, thash, codigo, nuevoRegistro);
        return #ok(#registroSuccessfullyAdded);
    };

    //obtener un registro por codigo
    public shared (msg) func getRegistro(codigo : Text) : async Types.GetRegistroResult {
        //if (Principal.isAnonymous(msg.caller)) return #err(#userNotAuthenticated);

        switch (Map.get(registros, thash, codigo)) {
            case (null) { #err(#registroDoesNotExist) };
            case (?registro) { #ok(#registro(registro)) };
        };
    };

    //eliminar registro
    public shared (msg) func deleteRegistro(codigo : Text) : async Types.GetRegistroResult {
        //if (Principal.isAnonymous(msg.caller)) return #err(#userNotAuthenticated);

        switch (Map.get(registros, thash, codigo)) {
            case (null) { #err(#registroDoesNotExist) };
            case (?_) {
                Map.delete(registros, thash, codigo);
                Debug.print("Registro eliminado: " # codigo);
                return #ok(#registroSuccessfullyDeleted);
            };
        };
    };

    //listar todos los registros
    public query (msg) func getRegistros() : async Types.GetRegistroResult {
        //if (Principal.isAnonymous(msg.caller)) return #err(#userNotAuthenticated);
        return #ok(#registros(Iter.toArray(Map.vals(registros))));
    };

    //buscar registros que contengan una parte del codigo en particular, ej un gtin
    public query (msg) func buscarRegistros(texto : Text) : async Types.GetRegistroResult {
        //if (Principal.isAnonymous(msg.caller)) return #err(#userNotAuthenticated);

        let todosRegistros = Map.vals(registros);
        let registrosFiltrados = Iter.filter<Types.Registro>(
            todosRegistros,
            func(registro) {
                Text.contains(registro.codigoGs1, #text texto);
            },
        );

        return #ok(#registros(Iter.toArray(registrosFiltrados)));
    };

    //verificar solo la existencia de un registro
    public query (msg) func existeRegistro(codigo : Text) : async Bool {
        //if (Principal.isAnonymous(msg.caller)) return false;
        return Map.has(registros, thash, codigo);
    };

    //obtener cantidad total de registros
    public query (msg) func totalRegistros() : async Nat {
        //if (Principal.isAnonymous(msg.caller)) return 0;
        return Map.size(registros);
    };

    //funcion para ver nuestro id de usuario
    public query ({ caller }) func whoami() : async Principal {
        return caller;
    };

    //generar qr
    stable var qrRegistros = Map.new<Text, [Types.QRRegistro]>();

    public shared (msg) func generarYGuardarQR(
        dominio : Text,
        gtin : Text,
        lote : Text,
        serieInicial : Text,
        cantidad : Nat,
    ) : async Types.QRListResult {

        // 1. Generar las series
        let series = Generacion.generarSeries(serieInicial, cantidad);
        if (series.size() == 0) {
            return #err({ mensaje = "Serie inicial inválida" });
        };

        // 2. Construir registros
        let fecha = Time.now();

        let nuevos = Array.map<Text, Types.QRRegistro>(
            series,
            func(serie) {
                let codigoQR = Generacion.generarCodigoQR(dominio, gtin, lote, serie);
                {
                    dominio;
                    gtin;
                    lote;
                    serie;
                    codigoQR;
                    fecha;
                };
            },
        );

        // 3. Guardar en el mapa, agrupado por GTIN
        switch (Map.get(qrRegistros, thash, gtin)) {
            case (null) {
                Map.set(qrRegistros, thash, gtin, nuevos);
            };
            case (?existentes) {
                // Map.set(qrRegistros, thash, gtin, existentes # nuevos);
                let combinados = Array.append<Types.QRRegistro>(existentes, nuevos);
                Map.set(qrRegistros, thash, gtin, combinados);
            };
        };

        return #ok({ registros = nuevos });
    };


    public query func listarQR() : async [Types.QRRegistro] {
        Iter.toArray(
            Iter.flatten(
                Iter.map<[Types.QRRegistro], Iter.Iter<Types.QRRegistro>>(
                    Map.vals(qrRegistros),
                    func(regs : [Types.QRRegistro]) : Iter.Iter<Types.QRRegistro> {
                        regs.vals();
                    },
                )
            )
        );
    };

    public query func buscarQRporGTIN(gtin : Text) : async Types.QRListResult {
        switch (Map.get(qrRegistros, thash, gtin)) {
            case (null) return #err({ mensaje = "No existe el GTIN" });
            case (?regs) return #ok({ registros = regs });
        };
    };

    // Eliminar todos los QR de un GTIN
    public shared func deleteQRporGTIN(gtin : Text) : async Types.QRListResult {
        switch (Map.get(qrRegistros, thash, gtin)) {
            case null { #err({ mensaje = "GTIN no existe" }) };
            case (?_) {
                Map.delete(qrRegistros, thash, gtin);
                #ok({ registros = [] });
            };
        };
    };
    

};
