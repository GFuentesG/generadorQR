import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Array "mo:core/Array";


module {
  public func generarCodigoQR(dominio: Text, gtin: Text, lote: Text, serie: Text) : Text {
    return dominio # "/01/" # gtin # "/10/" # lote # "/21/" # serie;
  };

  public func generarSeries(serieInicial: Text, cantidad: Nat) : [Text] {
    let base = Int.fromText(serieInicial); // : ?Int [[core Int](https://internetcomputer.org/docs/motoko/core/Int)]
    switch (base) {
      case null { return [] };
      case (?n) {
        return Array.tabulate<Text>(cantidad, func(i) {
          Int.toText(n + Int.fromNat(i))  // Int.fromNat / Int.toText [[core Int](https://internetcomputer.org/docs/motoko/core/Int)]
        });
      };
    };
  };
}