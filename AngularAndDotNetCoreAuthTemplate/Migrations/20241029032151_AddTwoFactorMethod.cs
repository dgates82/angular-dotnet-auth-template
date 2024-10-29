using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AngularAndDotNetCoreAuthTemplate.Migrations
{
    /// <inheritdoc />
    public partial class AddTwoFactorMethod : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TwoFactorMethod",
                table: "AspNetUsers",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "1F3FFE36-8174-4F46-9D53-3FBA4395328F",
                column: "ConcurrencyStamp",
                value: "05ecaba9-c8b3-45a1-8f2e-267e6ad751ad");

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "76283B4C-12BC-4656-9DEB-D5EEEE6E006E",
                columns: new[] { "ConcurrencyStamp", "CreatedAt", "EmailConfirmed", "PasswordHash", "SecurityStamp", "TwoFactorMethod", "UpdatedAt" },
                values: new object[] { "b6d7d590-17af-4f09-bc75-88267df3816f", new DateTime(2024, 10, 28, 20, 21, 50, 463, DateTimeKind.Local).AddTicks(9485), false, "REDACTED-HASH-2==", "1d36b4b6-9a9d-4f97-a4b2-e6aa9203aaa0", null, new DateTime(2024, 10, 28, 20, 21, 50, 463, DateTimeKind.Local).AddTicks(9548) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TwoFactorMethod",
                table: "AspNetUsers");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "1F3FFE36-8174-4F46-9D53-3FBA4395328F",
                column: "ConcurrencyStamp",
                value: "795b15d6-f80f-42bc-b92f-24a2fedd5b67");

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "76283B4C-12BC-4656-9DEB-D5EEEE6E006E",
                columns: new[] { "ConcurrencyStamp", "CreatedAt", "EmailConfirmed", "PasswordHash", "SecurityStamp", "UpdatedAt" },
                values: new object[] { "fe5e6b33-a80f-46df-9ac0-494373d70e38", new DateTime(2023, 11, 3, 18, 27, 57, 794, DateTimeKind.Local).AddTicks(9617), true, "REDACTED-HASH-1==", "c1b47474-1d75-40d8-864e-ae648e609fb5", new DateTime(2023, 11, 3, 18, 27, 57, 794, DateTimeKind.Local).AddTicks(9686) });
        }
    }
}
