package tools

import (
	"context"
	"os"

	"github.com/jackc/pgx/v5"
	_ "github.com/joho/godotenv/autoload"
)

func Squeal() *pgx.Conn {
	conn, err := pgx.Connect(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		println("Error connecting to database")
		panic(err)
	}
	// defer conn.Close(context.Background())

	return conn
}
 