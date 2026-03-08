use anchor_lang::prelude::*;

declare_id!("9mPFAEyMGV3BD7CusGhvPRo1zxm3PsBMX71JiHyG4Zu1");

#[program]
pub mod scan_guard {
    use super::*;

    pub fn record_scan(ctx: Context<RecordScan>, nonce: String) -> Result<()> {
        require!(nonce.len() <= 64, ScanGuardError::NonceTooLong);
        let record = &mut ctx.accounts.scan_record;
        record.authority = ctx.accounts.authority.key();
        record.nonce = nonce;
        record.timestamp = Clock::get()?.unix_timestamp;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(nonce: String)]
pub struct RecordScan<'info> {
    #[account(
        init,
        payer = authority,
        space = ScanRecord::space(&nonce),
        seeds = [b"scan", nonce.as_bytes()],
        bump
    )]
    pub scan_record: Account<'info, ScanRecord>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct ScanRecord {
    pub authority: Pubkey,
    pub nonce: String,
    pub timestamp: i64,
}

impl ScanRecord {
    pub fn space(nonce: &str) -> usize {
        8 + 32 + 4 + nonce.len() + 8
    }
}

#[error_code]
pub enum ScanGuardError {
    #[msg("Nonce exceeds maximum length of 64 characters")]
    NonceTooLong,
}
