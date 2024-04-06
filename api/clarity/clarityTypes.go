package clarity

type ClarityPerk struct {
	Hash     uint32
	ItemHash uint32

	Name_en    string
	Name_de    string
	Name_es    string
	Name_esMX  string
	Name_fr    string
	Name_it    string
	Name_ja    string
	Name_ko    string
	Name_pl    string
	Name_ptBR  string
	Name_ru    string
	Name_zhCHT string
	Name_zhCHS string

	ItemName_en    string
	ItemName_de    string
	ItemName_es    string
	ItemName_esMX  string
	ItemName_fr    string
	ItemName_it    string
	ItemName_ja    string
	ItemName_ko    string
	ItemName_pl    string
	ItemName_ptBR  string
	ItemName_ru    string
	ItemName_zhCHT string
	ItemName_zhCHS string

	PerkType   string
	Icon       string
	ItemIcon   string
	LinkedWith []uint32
}