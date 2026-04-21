import Result "mo:base/Result";
import Text "mo:base/Text";
import Principal "mo:base/Principal";

module Types {
    
    public type RegistroId = Nat32 ;
    public type EmpresaId = Nat32;

    public type Empresa = {
        ruc: Text;
        nombre: Text;
        localDeProduccion: Text; 
    };

public type Registro = {
        codigoGs1 : Text;       
        owner : Principal;
        fechaCreacion : Int;
    };

    type GetRegistroResultOk = {
        #registro : Registro;
        #registros : [Registro];
        #registroSuccessfullyAdded;
        #registroSuccessfullyUpdated;
        #registroSuccessfullyDeleted;
    };

    type GetRegistroResultErr = {
        #registroDoesNotExist;
        #userNotAuthenticated;
        #invalidData;
        #registroAlreadyExists;
    };

    public type GetRegistroResult = Result.Result<GetRegistroResultOk, GetRegistroResultErr>;

    public type QRRegistro = {
        dominio: Text;
        gtin: Text;
        lote: Text;
        serie: Text;
        codigoQR: Text; 
        fecha: Int;
    };

    public type QRListResult = {
        #ok : { registros: [QRRegistro] };
        #err : { mensaje: Text };
    };

}